import { ref } from "vue"
import dayjs from "dayjs"
import type { ChartRow, GanttBarObject, GanttBarConfig } from "../types"
import type {
  ImportOptions,
  ImportResult,
  MSProjectData,
  JiraData,
  SpreadsheetRow,
  ImportFormat,
  JiraIssue,
  MSProjectTask
} from "../types/import"
import * as XLSX from "xlsx"
import { parseString } from "xml2js"
import Papa from "papaparse"

/**
 * Composable for importing data from various formats into the Gantt chart
 * Supports MS Project, Jira, CSV, and Excel formats
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
        case "msproject":
          return await parseMsProject(content.toString())
        case "jira":
          return JSON.parse(content.toString())
        case "csv":
          return parseCsv(content.toString())
        case "excel":
          return parseExcel(content as ArrayBuffer)
        default:
          throw new Error(`Format not supported: ${format}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during parsing"
      throw new Error(`Failed to parse file: ${errorMessage}`)
    }
  }

  /**
   * Parses MS Project XML format
   *
   * @param xmlContent - XML content to parse
   * @returns Promise with parsed data
   */
  const parseMsProject = async (xmlContent: string): Promise<MSProjectData> => {
    return new Promise((resolve, reject) => {
      parseString(xmlContent, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse MS Project XML: ${err.message}`))
        } else {
          // Normalize structure if needed
          if (result.Project && result.Project.Tasks) {
            // Ensure Task is always an array
            if (!Array.isArray(result.Project.Tasks.Task)) {
              result.Project.Tasks.Task = [result.Project.Tasks.Task]
            }
            resolve(result.Project)
          } else {
            reject(new Error("Invalid MS Project XML structure"))
          }
        }
      })
    })
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
        // Normalize headers by removing spaces and lowercasing
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
   * Parses Excel format
   *
   * @param content - Excel file content as ArrayBuffer
   * @returns Array of parsed rows
   */
  const parseExcel = (content: ArrayBuffer): SpreadsheetRow[] => {
    const workbook = XLSX.read(content, { type: "array" })

    // Use first sheet by default
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error("No sheets found in Excel file")
    }

    const worksheet = workbook.Sheets[firstSheetName]!
    const data = XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet, {
      defval: null,
      raw: false
    })

    return data
  }

  /**
   * Converts MS Project data to Gantt chart format
   *
   * @param data - MS Project data
   * @param options - Import options
   * @returns Rows in Gantt chart format
   */
  const convertMsProjectToGantt = (
    data: MSProjectData,
    options: ImportOptions
  ): { rows: ChartRow[]; warnings: string[] } => {
    const warnings: string[] = []
    const allTasks = data.Tasks.Task || []

    // Create a map of all tasks for easy lookup
    const taskMap = new Map<string, MSProjectTask>()
    for (const task of allTasks) {
      taskMap.set(task.UID, task)
    }

    // Create a map for task's parent relationship
    const parentChildMap = new Map<string, string[]>()
    allTasks.forEach((task) => {
      if (task.ParentTaskUID) {
        if (!parentChildMap.has(task.ParentTaskUID)) {
          parentChildMap.set(task.ParentTaskUID, [])
        }
        parentChildMap.get(task.ParentTaskUID)?.push(task.UID)
      }
    })

    // Process tasks and build hierarchical structure
    const rootTasks = allTasks.filter(
      (task) => !task.ParentTaskUID || !taskMap.has(task.ParentTaskUID) || task.OutlineLevel === 1
    )

    /**
     * Recursively builds chart rows from tasks
     */
    const buildRows = (tasks: MSProjectTask[]): ChartRow[] => {
      return tasks.map((task) => {
        // Create bar config
        const barConfig: GanttBarConfig = {
          id: `task-${task.UID}`,
          label: task.Name,
          progress: task.PercentComplete || 0,
          immobile: false,
          connections: []
        }

        // Process duration and dates
        let startDate = task.Start
        let endDate = task.Finish

        if (!startDate || !endDate) {
          warnings.push(`Task "${task.Name}" has missing date information`)
          // Set default dates if missing
          startDate = dayjs().format("YYYY-MM-DD")
          endDate = dayjs().add(1, "day").format("YYYY-MM-DD")
        }

        // Create the bar object
        const barObject: GanttBarObject = {
          [options.mapFields?.startDate || "start"]: startDate,
          [options.mapFields?.endDate || "end"]: endDate,
          ganttBarConfig: barConfig
        }

        // Process dependencies
        if (task.PredecessorLink && Array.isArray(task.PredecessorLink)) {
          task.PredecessorLink.forEach((link) => {
            // Find the predecessor task and add a connection FROM the predecessor TO this task
            const predecessorTask = taskMap.get(link.PredecessorUID)
            if (predecessorTask) {
              // Add connection from predecessor to current task
              const existingBarIndex = allTasks.findIndex((t) => t.UID === predecessorTask.UID)
              if (existingBarIndex !== -1) {
                if (!allTasks[existingBarIndex]!.connections) {
                  allTasks[existingBarIndex]!.connections = []
                }
                allTasks[existingBarIndex]!.connections.push({
                  targetId: `task-${task.UID}`,
                  type: mapDependencyType(link.Type)
                })
              }
            }
          })
        }

        // Create chart row
        const chartRow: ChartRow = {
          id: task.UID,
          label: task.Name,
          bars: [barObject]
        }

        // Add milestone flag if applicable
        if (task.Milestone) {
          barConfig.class = "milestone"
          // For milestones typically the end date equals start date
          barObject[options.mapFields?.endDate || "end"] = startDate
        }

        // Process child tasks recursively
        const childIds = parentChildMap.get(task.UID) || []
        if (childIds.length > 0) {
          const childTasks = childIds
            .map((id) => taskMap.get(id))
            .filter((task): task is MSProjectTask => !!task)

          chartRow.children = buildRows(childTasks)
        }

        return chartRow
      })
    }

    return {
      rows: buildRows(rootTasks),
      warnings
    }
  }

  /**
   * Maps MS Project dependency type to Gantt connection type
   */
  const mapDependencyType = (type: number): "bezier" | "straight" | "squared" => {
    // MS Project dependency types:
    // 0 = Finish-to-Start (FS) - most common
    // 1 = Start-to-Start (SS)
    // 2 = Finish-to-Finish (FF)
    // 3 = Start-to-Finish (SF) - rarely used

    switch (type) {
      case 0:
        return "straight" // FS
      case 1:
        return "bezier" // SS
      case 2:
        return "bezier" // FF
      case 3:
        return "squared" // SF
      default:
        return "straight"
    }
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

    // Create a map of all issues for easy lookup
    const issueMap = new Map()
    for (const issue of issues) {
      issueMap.set(issue.id, issue)
    }

    // Find root issues (no parent or parent not in the dataset)
    const rootIssues = issues.filter(
      (issue) => !issue.fields.parent || !issueMap.has(issue.fields.parent.id)
    )

    // Build issue tree
    const buildRows = (issues: JiraIssue[]): ChartRow[] => {
      return issues.map((issue) => {
        const { fields } = issue

        // Determine start and end dates
        let startDate = fields.created
        let endDate = fields.duedate || fields.updated

        if (!endDate || !startDate) {
          warnings.push(`Issue "${fields.summary}" has missing date information`)
          startDate = dayjs().format("YYYY-MM-DD")
          endDate = dayjs().add(7, "day").format("YYYY-MM-DD")
        }

        // Calculate progress based on status
        let progress = 0
        if (fields.status) {
          switch (fields.status.name.toLowerCase()) {
            case "to do":
            case "open":
              progress = 0
              break
            case "in progress":
              progress = 50
              break
            case "done":
            case "closed":
            case "resolved":
              progress = 100
              break
            default:
              // Try to estimate progress from status name
              if (fields.status.name.toLowerCase().includes("progress")) {
                progress = 50
              }
          }
        }

        // Create bar config
        const barConfig: GanttBarConfig = {
          id: `issue-${issue.key}`,
          label: fields.summary,
          progress,
          connections: []
        }

        // Add issue type as CSS class
        if (fields.issuetype) {
          barConfig.class = fields.issuetype.name.toLowerCase().replace(/\s+/g, "-")
        }

        // Process links/dependencies
        if (fields.issuelinks && Array.isArray(fields.issuelinks)) {
          fields.issuelinks.forEach((link) => {
            // Invert the connection direction - issues that this issue depends on should point to this issue
            if (link.outwardIssue) {
              // Find the source issue and add a connection FROM the source TO this issue
              const sourceIssue = issues.find((i) => i.key === link.outwardIssue!.key)
              if (sourceIssue) {
                const sourceIssueConfig = sourceIssue.fields.barConfig || { connections: [] }
                if (!sourceIssueConfig.connections) {
                  sourceIssueConfig.connections = []
                }
                sourceIssueConfig.connections.push({
                  targetId: `issue-${issue.key}`,
                  type: "straight"
                })
                sourceIssue.fields.barConfig = sourceIssueConfig
              }
            }
          })
        }

        // Create bar object
        const barObject: GanttBarObject = {
          [options.mapFields?.startDate || "start"]: startDate,
          [options.mapFields?.endDate || "end"]: endDate,
          ganttBarConfig: barConfig
        }

        // Create chart row
        const chartRow: ChartRow = {
          id: issue.id,
          label: fields.summary,
          bars: [barObject]
        }

        // Process subtasks recursively
        if (fields.subtasks && Array.isArray(fields.subtasks) && fields.subtasks.length > 0) {
          chartRow.children = buildRows(fields.subtasks)
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
   * Ensures a date string has time component
   * Handles various date formats including those with hours
   */
  const ensureDateHasTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return dayjs().format("YYYY-MM-DD HH:mm:ss")

    // Try to parse the date
    const date = dayjs(dateStr)
    if (!date.isValid()) {
      return dayjs().format("YYYY-MM-DD HH:mm:ss")
    }

    // Check if there's a time component by testing if hours and minutes are 0
    // and the original string doesn't contain time indicators
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
   * Converts spreadsheet data (CSV/Excel) to Gantt chart format
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

    // Map field names to expected properties
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

    // Normalize field names from the data
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

    // Build a map of tasks by ID for easy lookup
    const rowsById = new Map<
      string | number,
      SpreadsheetRow & {
        children: (string | number)[]
        barConfig?: GanttBarConfig
      }
    >()

    // First pass: identify all tasks and setup parent-child relationships
    data.forEach((row) => {
      const idField = normalizeFieldName(row, fieldMap.id as string[])
      const id = idField ? row[idField] : undefined

      if (!id) {
        warnings.push(`Row is missing an ID field: ${JSON.stringify(row)}`)
        return
      }

      rowsById.set(id, { ...row, children: [], barConfig: { id: `task-${id}`, connections: [] } })
    })

    // Second pass: establish parent-child relationships and process dependencies
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

      // Process dependencies - this is where we need to fix the direction
      const dependenciesField = normalizeFieldName(row, fieldMap.dependencies as string[])
      if (dependenciesField && row[dependenciesField]) {
        const dependencies = String(row[dependenciesField]).split(/[,;]\s*/)

        dependencies.forEach((depId) => {
          // Try to find the dependency by ID, accounting for potential type differences
          const depIdAsNumber = Number(depId)
          const depIdAsString = String(depId)

          // Check if dependency exists in either format
          const dependencyExists = rowsById.has(depIdAsNumber) || rowsById.has(depIdAsString)
          const dependencyRow = rowsById.get(depIdAsNumber) || rowsById.get(depIdAsString)

          if (dependencyExists && dependencyRow) {
            // Inverto la direzione delle dipendenze
            // Aggiungo una connessione DAL predecessore (depId) A questo task (id)
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

    // Identify root rows (no parent or parent not in dataset)
    const rootIds = Array.from(rowsById.keys()).filter((id) => {
      const row = rowsById.get(id)
      if (!row) return false

      const parentField = normalizeFieldName(row, fieldMap.parentId as string[])
      const parentId = parentField ? row[parentField] : undefined

      return !parentId || !rowsById.has(parentId)
    })

    // Build Gantt rows recursively
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

        // CORREZIONE: Gestione migliore dei formati di data con ore
        let start = startDate
          ? ensureDateHasTime(String(startDate))
          : dayjs().format("YYYY-MM-DD HH:mm:ss")
        let end = endDate
          ? ensureDateHasTime(String(endDate))
          : dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss")

        if (isMilestone) {
          end = start
        }

        // Get bar config with any connections already set up during dependency processing
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

      const content = await readFileContent(file, format)
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
   * Imports data from a string or object
   *
   * @param data - Data to import
   * @param options - Import options
   * @returns Promise with import result
   */
  const importFromData = async (
    data: string | object,
    options: ImportOptions
  ): Promise<ImportResult> => {
    isImporting.value = true
    importProgress.value = 0
    lastError.value = null

    try {
      let parsedData

      if (typeof data === "string") {
        if (!options.format) {
          if (data.trim().startsWith("{") || data.trim().startsWith("[")) {
            options.format = "jira"
          } else if (data.trim().startsWith("<?xml") || data.trim().startsWith("<Project")) {
            options.format = "msproject"
          } else if (data.includes(",") || data.includes(";")) {
            options.format = "csv"
          } else {
            throw new Error("Could not determine format from string data")
          }
        }

        parsedData = await parseFileContent(data, options.format)
      } else {
        parsedData = data

        if (!options.format) {
          if ("issues" in parsedData) {
            options.format = "jira"
          } else if ("Tasks" in parsedData) {
            options.format = "msproject"
          } else {
            options.format = "csv"
          }
        }
      }

      importProgress.value = 40

      const { rows, warnings, chartStart, chartEnd } = await convertToGantt(
        parsedData,
        options.format,
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

    if (fileName.endsWith(".xml") || fileName.endsWith(".mpp")) {
      return "msproject"
    } else if (fileName.endsWith(".json")) {
      return "jira"
    } else if (fileName.endsWith(".csv")) {
      return "csv"
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return "excel"
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
  const readFileContent = async (
    file: File,
    format: ImportFormat
  ): Promise<string | ArrayBuffer> => {
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

      if (format === "excel") {
        reader.readAsArrayBuffer(file)
      } else {
        reader.readAsText(file)
      }
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
      case "msproject":
        result = convertMsProjectToGantt(data, options)
        break
      case "jira":
        result = convertJiraToGantt(data, options)
        break
      case "csv":
      case "excel":
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
    importFromData,
    isImporting,
    importProgress,
    lastError
  }
}
