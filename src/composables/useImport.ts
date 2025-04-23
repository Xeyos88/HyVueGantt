import { ref } from "vue"
import dayjs from "dayjs"
import type {
  ChartRow,
  GanttBarObject,
  GanttBarConfig,
  BaseConnection,
  ConnectionType
} from "../types"
import type {
  ImportOptions,
  ImportResult,
  JiraData,
  SpreadsheetRow,
  ImportFormat,
  JiraIssue
} from "../types/import"
import Papa from "papaparse"

/**
 * Composable for importing data from various formats into the Gantt chart
 * Supports Jira, CSV formats
 *
 * @returns Object containing import state and methods
 */
export function useImport() {
  const isImporting = ref(false)
  const lastError = ref<string | null>(null)
  const importProgress = ref(0)

  /**
   * Parses file content based on format
   *
   * @param content - File content to parse
   * @param format - Format to parse (detected from file extension or specified)
   * @returns Promise with parsed data
   */
  const parseFileContent = async (
    content: string | ArrayBuffer,
    format: ImportFormat
  ): Promise<any> => {
    try {
      switch (format) {
        case "jira":
          return JSON.parse(content.toString())
        case "csv":
          return parseCsv(content.toString())
        default:
          throw new Error(`Format not supported: ${format}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during parsing"
      throw new Error(`Failed to parse file: ${errorMessage}`)
    }
  }

  /**
   * Parses CSV format
   *
   * @param csvContent - CSV content to parse
   * @returns Array of parsed rows
   */
  const parseCsv = (csvContent: string): SpreadsheetRow[] => {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => {
        return header.trim().toLowerCase().replace(/\s+/g, "_")
      }
    })

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors.map((err) => err.message).join("; ")
      throw new Error(`CSV parsing errors: ${errorMessage}`)
    }

    return result.data as SpreadsheetRow[]
  }

  /**
   * Converts Jira data to Gantt chart format
   *
   * @param data - Jira data
   * @param options - Import options
   * @returns Rows in Gantt chart format
   */
  const convertJiraToGantt = (
    data: JiraData,
    options: ImportOptions
  ): { rows: ChartRow[]; warnings: string[] } => {
    const warnings: string[] = []
    const issues = data.issues || []

    const issueMap = new Map<string, JiraIssue>()
    const barConfigMap = new Map<string, GanttBarConfig>()

    const connectionsMap = new Map<string, BaseConnection[]>()

    issues.forEach((issue) => {
      issueMap.set(issue.id, issue)

      const barConfig: GanttBarConfig = {
        id: `issue-${issue.key}`,
        label: issue.fields.summary,
        progress: calculateProgress(issue.fields.status),
        connections: []
      }

      if (issue.fields.issuetype) {
        barConfig.class = issue.fields.issuetype.name.toLowerCase().replace(/\s+/g, "-")
      }

      barConfigMap.set(issue.key, barConfig)
    })

    issues.forEach((issue) => {
      if (issue.fields.issuelinks && Array.isArray(issue.fields.issuelinks)) {
        issue.fields.issuelinks.forEach((link) => {
          if (link.outwardIssue) {
            const sourceKey = issue.key
            const targetKey = link.outwardIssue.key

            if (!connectionsMap.has(sourceKey)) {
              connectionsMap.set(sourceKey, [])
            }

            const connection: BaseConnection = {
              targetId: `issue-${targetKey}`,
              type: mapLinkTypeToConnectionType(link.type?.name)
            }

            connectionsMap.get(sourceKey)?.push(connection)
          }

          if (link.inwardIssue) {
            const sourceKey = link.inwardIssue.key
            const targetKey = issue.key

            if (!connectionsMap.has(sourceKey)) {
              connectionsMap.set(sourceKey, [])
            }

            const connection: BaseConnection = {
              targetId: `issue-${targetKey}`,
              type: mapLinkTypeToConnectionType(link.type?.name)
            }

            connectionsMap.get(sourceKey)?.push(connection)
          }
        })
      }
    })

    const childrenMap = new Map<string, JiraIssue[]>()

    issues.forEach((issue) => {
      if (
        issue.fields.subtasks &&
        Array.isArray(issue.fields.subtasks) &&
        issue.fields.subtasks.length > 0
      ) {
        issue.fields.subtasks.forEach((subtask) => {
          const fullSubtask = issues.find((i) => i.id === subtask.id) || subtask

          if (!childrenMap.has(issue.id)) {
            childrenMap.set(issue.id, [])
          }
          childrenMap.get(issue.id)?.push(fullSubtask)
        })
      }
    })

    issues.forEach((issue) => {
      if (issue.fields.parent && issue.fields.parent.id) {
        const parentId = issue.fields.parent.id

        const isExplicitSubtask = issues.some(
          (parentIssue) =>
            parentIssue.id === parentId &&
            parentIssue.fields.subtasks?.some((st) => st.id === issue.id)
        )

        if (!isExplicitSubtask) {
          if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, [])
          }
          childrenMap.get(parentId)?.push(issue)
        }
      }
    })

    const rootIssues = issues.filter(
      (issue) => !issue.fields.parent || !issueMap.has(issue.fields.parent.id)
    )

    const buildRows = (issues: JiraIssue[]): ChartRow[] => {
      return issues.map((issue) => {
        const { fields } = issue

        let startDate = fields.created
        let endDate = fields.duedate || fields.updated

        if (!endDate || !startDate) {
          warnings.push(`Issue "${fields.summary}" has missing date information`)
          startDate = dayjs().format("YYYY-MM-DD")
          endDate = dayjs().add(7, "day").format("YYYY-MM-DD")
        }

        const barConfig = barConfigMap.get(issue.key) || {
          id: `issue-${issue.key}`,
          label: fields.summary,
          progress: calculateProgress(fields.status),
          connections: []
        }

        const connections = connectionsMap.get(issue.key) || []
        barConfig.connections = connections

        const barObject: GanttBarObject = {
          [options.mapFields?.startDate || "start"]: startDate,
          [options.mapFields?.endDate || "end"]: endDate,
          ganttBarConfig: barConfig
        }

        const chartRow: ChartRow = {
          id: issue.id,
          label: fields.summary,
          bars: [barObject]
        }

        const children = childrenMap.get(issue.id) || []
        if (children.length > 0) {
          chartRow.children = buildRows(children)
        }

        return chartRow
      })
    }

    return {
      rows: buildRows(rootIssues),
      warnings
    }
  }

  /**
   * Helper function to calculate progress based on JIRA status
   */
  function calculateProgress(status: any): number {
    if (!status) return 0

    switch (status.name.toLowerCase()) {
      case "to do":
      case "open":
      case "nuovo":
        return 0

      case "in progress":
      case "in corso":
        return 50

      case "done":
      case "closed":
      case "resolved":
      case "completato":
        return 100

      default:
        if (status.name.toLowerCase().includes("progress")) {
          return 50
        }
        return 0
    }
  }

  /**
   * Maps JIRA link types to connection types
   * Ora restituisce esplicitamente un valore ConnectionType
   */
  function mapLinkTypeToConnectionType(linkType: string | undefined): ConnectionType {
    if (!linkType) return "straight"

    const lowerType = linkType.toLowerCase()

    if (lowerType.includes("block")) {
      return "squared"
    }

    if (lowerType.includes("depend") || lowerType.includes("relate")) {
      return "bezier"
    }

    return "straight"
  }

  /**
   * Ensures a date string has time component
   * Handles various date formats including those with hours
   */
  const ensureDateHasTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return dayjs().format("YYYY-MM-DD HH:mm:ss")

    const date = dayjs(dateStr)
    if (!date.isValid()) {
      return dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    const hasTimeComponent =
      date.hour() !== 0 ||
      date.minute() !== 0 ||
      date.second() !== 0 ||
      /\d{1,2}[:hHT]/.test(dateStr)

    return hasTimeComponent
      ? date.format("YYYY-MM-DD HH:mm:ss")
      : `${date.format("YYYY-MM-DD")} 00:00:00`
  }

  /**
   * Converts spreadsheet data (CSV) to Gantt chart format
   *
   * @param data - Spreadsheet data
   * @param options - Import options
   * @returns Rows in Gantt chart format
   */
  const convertSpreadsheetToGantt = (
    data: SpreadsheetRow[],
    options: ImportOptions
  ): { rows: ChartRow[]; warnings: string[] } => {
    const warnings: string[] = []

    const fieldMap = {
      id: ["id", "taskid", "task_id", "key"],
      name: ["name", "task", "taskname", "task_name", "summary", "title"],
      startDate: ["start", "startdate", "start_date", "begins", "begin_date"],
      endDate: [
        "end",
        "enddate",
        "end_date",
        "finish",
        "finishdate",
        "finish_date",
        "due",
        "duedate",
        "due_date"
      ],
      duration: ["duration", "length"],
      progress: ["progress", "percent", "completion", "complete", "percent_complete"],
      parentId: ["parent", "parentid", "parent_id", "parent_task"],
      dependencies: ["dependencies", "depends", "predecessors", "links"],
      milestone: ["milestone", "is_milestone", "ismilestone"],
      ...options.mapFields
    }

    const normalizeFieldName = (
      row: SpreadsheetRow,
      fieldOptions: string[]
    ): string | undefined => {
      const keys = Object.keys(row)
      for (const option of fieldOptions) {
        const matchingKey = keys.find((k) => k.toLowerCase() === option.toLowerCase())
        if (matchingKey !== undefined) {
          return matchingKey
        }
      }
      return undefined
    }

    const rowsById = new Map<
      string | number,
      SpreadsheetRow & {
        children: (string | number)[]
        barConfig?: GanttBarConfig
      }
    >()

    data.forEach((row) => {
      const idField = normalizeFieldName(row, fieldMap.id as string[])
      const id = idField ? row[idField] : undefined

      if (!id) {
        warnings.push(`Row is missing an ID field: ${JSON.stringify(row)}`)
        return
      }

      rowsById.set(id, { ...row, children: [], barConfig: { id: `task-${id}`, connections: [] } })
    })

    data.forEach((row) => {
      const idField = normalizeFieldName(row, fieldMap.id as string[])
      const id = idField ? row[idField] : undefined

      if (!id) return

      const parentField = normalizeFieldName(row, fieldMap.parentId as string[])
      const parentId = parentField ? row[parentField] : undefined

      if (parentId && rowsById.has(parentId)) {
        const parent = rowsById.get(parentId)
        if (parent) {
          parent.children.push(id)
        }
      }

      const dependenciesField = normalizeFieldName(row, fieldMap.dependencies as string[])
      if (dependenciesField && row[dependenciesField]) {
        const dependencies = String(row[dependenciesField]).split(/[,;]\s*/)

        dependencies.forEach((depId) => {
          const depIdAsNumber = Number(depId)
          const depIdAsString = String(depId)

          const dependencyExists = rowsById.has(depIdAsNumber) || rowsById.has(depIdAsString)
          const dependencyRow = rowsById.get(depIdAsNumber) || rowsById.get(depIdAsString)

          if (dependencyExists && dependencyRow) {
            if (dependencyRow.barConfig) {
              dependencyRow.barConfig.connections = dependencyRow.barConfig.connections || []
              dependencyRow.barConfig.connections.push({
                targetId: `task-${id}`,
                type: "straight"
              })
            }
          } else {
            warnings.push(`Task ${id} refers to a dependency ${depId} that doesn't exist`)
          }
        })
      }
    })

    const rootIds = Array.from(rowsById.keys()).filter((id) => {
      const row = rowsById.get(id)
      if (!row) return false

      const parentField = normalizeFieldName(row, fieldMap.parentId as string[])
      const parentId = parentField ? row[parentField] : undefined

      return !parentId || !rowsById.has(parentId)
    })

    const buildRows = (ids: (string | number)[]): ChartRow[] => {
      return ids.map((id) => {
        const row = rowsById.get(id)
        if (!row) {
          warnings.push(`Referenced ID ${id} not found in data`)
          return {
            id: String(id),
            label: `Unknown Task (${id})`,
            bars: []
          }
        }

        const nameField = normalizeFieldName(row, fieldMap.name as string[])
        const name = nameField ? String(row[nameField] || "") : `Task ${id}`

        let startDateField = normalizeFieldName(row, fieldMap.startDate as string[])
        if (!startDateField && "start_date" in row) {
          startDateField = "start_date"
        }
        let startDate = startDateField ? row[startDateField] : undefined

        let endDateField = normalizeFieldName(row, fieldMap.endDate as string[])
        if (!endDateField && "end_date" in row) {
          endDateField = "end_date"
        }
        let endDate = endDateField ? row[endDateField] : undefined

        const progressField = normalizeFieldName(row, fieldMap.progress as string[])
        let progress = progressField ? row[progressField] : undefined

        if (progress !== undefined) {
          if (typeof progress === "string") {
            progress = parseFloat(progress.replace("%", ""))
          }

          progress = Math.max(0, Math.min(100, Number(progress)))

          if (isNaN(progress as number)) {
            progress = 0
          }
        }

        const milestoneField = normalizeFieldName(row, fieldMap.milestone as string[])
        const isMilestone = milestoneField
          ? row[milestoneField] === true ||
            row[milestoneField] === "true" ||
            row[milestoneField] === 1
          : false

        let start = startDate
          ? ensureDateHasTime(String(startDate))
          : dayjs().format("YYYY-MM-DD HH:mm:ss")
        let end = endDate
          ? ensureDateHasTime(String(endDate))
          : dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss")

        if (isMilestone) {
          end = start
        }

        const barConfig: GanttBarConfig = {
          ...row.barConfig,
          id: `task-${id}`,
          label: name,
          progress: progress as number,
          immobile: false
        }

        if (isMilestone) {
          barConfig.class = "milestone"
        }

        const barObject: GanttBarObject = {
          [options.mapFields?.startDate || "start"]: start,
          [options.mapFields?.endDate || "end"]: end,
          ganttBarConfig: barConfig
        }

        const chartRow: ChartRow = {
          id,
          label: name,
          bars: [barObject]
        }

        if (row.children.length > 0) {
          chartRow.children = buildRows(row.children)
        }

        return chartRow
      })
    }

    return {
      rows: buildRows(rootIds),
      warnings
    }
  }

  /**
   * Imports data from a file
   *
   * @param file - File to import
   * @param options - Import options
   * @returns Promise with import result
   */
  const importFromFile = async (file: File, options: ImportOptions): Promise<ImportResult> => {
    isImporting.value = true
    importProgress.value = 0
    lastError.value = null

    try {
      let format = options.format
      if (!format) {
        format = detectFormatFromFile(file)
      }

      const content = await readFileContent(file)

      importProgress.value = 20

      const parsedData = await parseFileContent(content, format)

      importProgress.value = 50

      const { rows, warnings, chartStart, chartEnd } = await convertToGantt(
        parsedData,
        format,
        options
      )
      importProgress.value = 80

      if (!options.skipValidation) {
        validateImportedData(rows, warnings)
      }

      importProgress.value = 100

      if (options.onProgress) {
        options.onProgress(100)
      }

      return {
        success: true,
        data: {
          rows,
          chartStart,
          chartEnd
        },
        warnings
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during import"
      lastError.value = errorMessage

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      isImporting.value = false
    }
  }

  /**
   * Detects import format from file extension
   *
   * @param file - File to detect format from
   * @returns Detected format
   */
  const detectFormatFromFile = (file: File): ImportFormat => {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith(".json")) {
      return "jira"
    } else if (fileName.endsWith(".csv")) {
      return "csv"
    }

    throw new Error(`Could not determine format from file: ${file.name}`)
  }

  /**
   * Reads file content based on format
   *
   * @param file - File to read
   * @param format - Format to read
   * @returns Promise with file content
   */
  const readFileContent = async (file: File): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result)
        } else {
          reject(new Error("Failed to read file"))
        }
      }

      reader.onerror = () => {
        reject(new Error("Error reading file"))
      }

      reader.readAsText(file)
    })
  }

  /**
   * Converts parsed data to Gantt chart format
   *
   * @param data - Parsed data
   * @param format - Data format
   * @param options - Import options
   * @returns Converted data and warnings
   */
  const convertToGantt = async (
    data: any,
    format: ImportFormat,
    options: ImportOptions
  ): Promise<{
    rows: ChartRow[]
    warnings: string[]
    chartStart?: string | Date
    chartEnd?: string | Date
  }> => {
    let result

    switch (format) {
      case "jira":
        result = convertJiraToGantt(data, options)
        break
      case "csv":
        result = convertSpreadsheetToGantt(data, options)
        break
      default:
        throw new Error(`Conversion not implemented for format: ${format}`)
    }

    const { chartStart, chartEnd } = calculateChartDateRange(result.rows)

    return {
      ...result,
      chartStart,
      chartEnd
    }
  }

  /**
   * Calculates the optimal chart date range based on task dates
   *
   * @param rows - Gantt chart rows
   * @returns Start and end dates for the chart
   */
  const calculateChartDateRange = (rows: ChartRow[]): { chartStart?: Date; chartEnd?: Date } => {
    let minDate: dayjs.Dayjs | null = null
    let maxDate: dayjs.Dayjs | null = null

    const processRows = (rows: ChartRow[]) => {
      rows.forEach((row) => {
        row.bars.forEach((bar) => {
          const startDate = dayjs(bar.start || bar.begin || bar.startDate)
          const endDate = dayjs(bar.end || bar.finish || bar.endDate)

          if (!minDate || startDate.isBefore(minDate)) {
            minDate = startDate
          }

          if (!maxDate || endDate.isAfter(maxDate)) {
            maxDate = endDate
          }
        })

        if (row.children) {
          processRows(row.children)
        }
      })
    }

    processRows(rows)

    if (minDate && maxDate) {
      const rangeDays = (maxDate as dayjs.Dayjs).diff(minDate, "day")
      const buffer = Math.max(1, Math.ceil(rangeDays * 0.1))

      return {
        chartStart: (minDate as dayjs.Dayjs).subtract(buffer, "day").toDate(),
        chartEnd: (maxDate as dayjs.Dayjs).add(buffer, "day").toDate()
      }
    }

    return {}
  }

  /**
   * Validates imported data for completeness and correctness
   *
   * @param rows - Imported rows
   * @param warnings - Warnings array to append to
   */
  const validateImportedData = (rows: ChartRow[], warnings: string[]) => {
    const validateRow = (row: ChartRow, path: string) => {
      if (!row.id) {
        warnings.push(`Row at ${path} is missing an ID`)
      }

      if (!row.label) {
        warnings.push(`Row at ${path} is missing a label`)
      }

      if (!row.bars || row.bars.length === 0) {
        warnings.push(`Row at ${path} has no bars`)
      } else {
        row.bars.forEach((bar, i) => {
          if (!bar.ganttBarConfig.id) {
            warnings.push(`Bar ${i} at ${path} is missing an ID`)
          }

          if (bar.ganttBarConfig.connections) {
            bar.ganttBarConfig.connections.forEach((conn, j) => {
              if (!conn.targetId) {
                warnings.push(`Connection ${j} in bar ${i} at ${path} is missing a target ID`)
              }
            })
          }
        })
      }

      if (row.children) {
        row.children.forEach((child, i) => {
          validateRow(child, `${path} > child[${i}]`)
        })
      }
    }

    rows.forEach((row, i) => {
      validateRow(row, `root[${i}]`)
    })
  }

  return {
    importFromFile,
    isImporting,
    importProgress,
    lastError
  }
}
