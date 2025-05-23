import { ref, type Ref } from "vue"
import type { ChartRow, ExportOptions, ExportResult, GanttBarObject, TimeUnit } from "../types"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"
import type { UseRowsReturn } from "./useRows"
import dayjs from "dayjs"

/**
 * Composable for the Gantt chart export functionality
 * Supports export to PDF, PNG, SVG and Excel
 *
 * @param getChartElement - Function that returns the chart's DOM element
 * @returns Functions and state for export
 */
export function useExport(
  getChartElement: () => HTMLElement | null,
  getWrapperElement: () => HTMLElement | null,
  rowManager: UseRowsReturn,
  config: {
    barStart: Ref<string>
    barEnd: Ref<string>
    dateFormat: Ref<string | false>
    precision: Ref<TimeUnit>
  }
) {
  const isExporting = ref(false)
  const lastError = ref<string | null>(null)

  /**
   * Pre-processes DOM elements before export to ensure
   * correct text positioning
   *
   * @param element - DOM element to pre-process
   * @returns Pre-processed DOM element
   */
  const prepareElementForExport = (
    element: HTMLElement,
    wrapperELement: HTMLElement,
    options: ExportOptions
  ): HTMLElement => {
    const clonedElement = wrapperELement.cloneNode(true) as HTMLElement

    clonedElement.style.width = element.offsetWidth + "px"
    clonedElement.style.height = element.offsetHeight + "px"

    const textSelectors = [".g-gantt-bar-label > div", ".g-timeunit-min", ".label-unit"]

    const textElements = clonedElement.querySelectorAll(textSelectors.join(", "))

    const commands = clonedElement.querySelector(".g-gantt-command") as HTMLElement
    commands.style.display = "none"

    if (!options.exportColumnLabel) {
      const columnLabels = clonedElement.querySelector(".g-gantt-label-section") as HTMLElement
      columnLabels.style.display = "none"
    }

    textElements.forEach((el) => {
      const element = el as HTMLElement

      element.style.display = "flex"
      element.style.alignItems = "center"
      element.style.justifyContent = "center"
      element.style.textAlign = "center"
      element.style.position = "relative"
      element.style.fontSize = "10px"

      element.style.transform = "translateY(-25%)"
    })

    const ellipsisElements = clonedElement.querySelectorAll(
      ".cell-content, .text-ellipsis, .text-ellipsis-value"
    )
    ellipsisElements.forEach((el) => {
      const element = el as HTMLElement
      element.style.overflow = "visible"
      element.style.alignItems = "center"
      element.style.whiteSpace = "normal"
      element.style.textOverflow = "ellipsis"
      element.style.fontSize = "10px"
      element.style.transform = "translateY(-1%)"
    })

    const rows = clonedElement.querySelectorAll(".g-label-column-row")
    rows.forEach((row) => {
      const rowElement = row as HTMLElement
      rowElement.style.overflow = "visible"
      rowElement.style.flexWrap = "wrap"
    })

    const barLabels = clonedElement.querySelectorAll(".g-gantt-bar-label")
    barLabels.forEach((el) => {
      const element = el as HTMLElement
      element.style.overflow = "hidden"
      element.style.textOverflow = "ellipsis"
      element.style.whiteSpace = "nowrap"
      element.style.transform = "translateY(-15%)"
    })

    const progressBars = clonedElement.querySelectorAll(".g-gantt-progress-bar")
    progressBars.forEach((el) => {
      const element = el as HTMLElement
      element.style.display = ""
      element.style.alignItems = ""
      element.style.justifyContent = ""
      element.style.transform = ""
      element.style.position = ""
    })

    const minUnitLabels = clonedElement.querySelectorAll(".g-timeunit-min")
    minUnitLabels.forEach((el) => {
      const element = el as HTMLElement

      element.style.transform = "translateY(-35%)"
    })

    const progressTexts = clonedElement.querySelectorAll(".progress-text")
    progressTexts.forEach((el) => {
      const element = el as HTMLElement

      element.style.transform = "translateY(-40%)"
    })

    const timeAxisEventsLabels = clonedElement.querySelectorAll(".g-timeaxis-event-label")
    timeAxisEventsLabels.forEach((el) => {
      const element = el as HTMLElement
      element.style.fontSize = "8px"
      element.style.transform = "translateY(-45%)"
    })

    const milestoneLabels = clonedElement.querySelectorAll(".g-gantt-milestone-label")
    milestoneLabels.forEach((el) => {
      const element = el as HTMLElement
      element.style.transform = "translateY(-15%)"
    })

    const milestoneMarkers = clonedElement.querySelectorAll(".g-gantt-milestone-marker")
    milestoneMarkers.forEach((el) => {
      const element = el as HTMLElement
      element.style.transform = "translateY(-0.2%)"
    })

    const rowLabels = clonedElement.querySelectorAll(".g-gantt-row-label")
    rowLabels.forEach((el) => {
      const element = el as HTMLElement
      element.style.transform = "translateY(-15%)"
    })

    return clonedElement
  }

  /**
   * Exports the chart in the specified format
   *
   * @param options - Export options
   * @returns Promise with the export result
   */
  const exportChart = async (options: ExportOptions): Promise<ExportResult> => {
    isExporting.value = true
    lastError.value = null

    try {
      const element = getChartElement()
      const wrapper = getWrapperElement()
      if (!element || !wrapper) {
        throw new Error("Gantt chart element not found")
      }

      const filename = options.filename || `gantt-export-${new Date().toISOString().slice(0, 10)}`

      switch (options.format) {
        case "pdf":
          return await exportToPdf(element, wrapper, {
            ...options,
            filename: filename + ".pdf"
          })
        case "png":
          return await exportToPng(element, wrapper, {
            ...options,
            filename: filename + ".png"
          })
        case "svg":
          return await exportToSvg(element, wrapper, {
            ...options,
            filename: filename + ".svg"
          })
        case "excel":
          return await exportToExcel({
            ...options,
            filename: filename + ".xlsx"
          })
        default:
          throw new Error(`Format file export not supported: ${options.format}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown Error"
      lastError.value = errorMessage

      return {
        success: false,
        data: null,
        error: errorMessage,
        filename: options.filename || "export-error"
      }
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Exports the chart in PDF format
   *
   * @param element - DOM element to export
   * @param options - Export options
   * @returns Promise with the export result
   */
  const exportToPdf = async (
    element: HTMLElement,
    wrapper: HTMLElement,
    options: ExportOptions
  ): Promise<ExportResult> => {
    try {
      const processedElement = prepareElementForExport(element, wrapper, options)

      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.width = element.offsetWidth + "px"
      tempContainer.style.height = element.offsetHeight + "px"
      tempContainer.style.overflow = "hidden"
      tempContainer.appendChild(processedElement)
      document.body.appendChild(tempContainer)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const paperSize = options.paperSize || "a4"
      const orientation = options.orientation || "landscape"
      const scale = options.scale || 1
      const margin = options.margin !== undefined ? options.margin : 10

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: paperSize
      })

      const canvas = await html2canvas(processedElement, {
        scale: scale,
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#ffffff",
        imageTimeout: 0,
        removeContainer: false,
        foreignObjectRendering: false
      })

      document.body.removeChild(tempContainer)

      const pageWidth =
        orientation === "landscape"
          ? pdf.internal.pageSize.getHeight()
          : pdf.internal.pageSize.getWidth()
      const pageHeight =
        orientation === "landscape"
          ? pdf.internal.pageSize.getWidth()
          : pdf.internal.pageSize.getHeight()
      const pdfWidth = pageWidth - margin * 2

      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = imgWidth / imgHeight
      const pdfHeight = pdfWidth / ratio

      if (pdfHeight > pageHeight - margin * 2) {
        let currentHeight = 0

        while (currentHeight < imgHeight) {
          if (currentHeight > 0) {
            pdf.addPage()
          }

          const canvasSection = Math.min(
            imgHeight - currentHeight,
            (imgWidth / pdfWidth) * (pageHeight - margin * 2)
          )

          const sectionHeight = (canvasSection / imgHeight) * imgHeight

          pdf.addImage(
            canvas.toDataURL("image/jpeg", options.quality || 0.95),
            "JPEG",
            margin,
            margin,
            pdfWidth,
            pdfWidth * (sectionHeight / imgWidth),
            "",
            "FAST",
            currentHeight / imgHeight
          )

          currentHeight += canvasSection
        }
      } else {
        pdf.addImage(
          canvas.toDataURL("image/jpeg", options.quality || 0.95),
          "JPEG",
          margin,
          margin,
          pdfWidth,
          pdfHeight,
          "",
          "FAST"
        )
      }

      const blob = pdf.output("blob")

      return {
        success: true,
        data: blob,
        filename: options.filename || "gantt-chart.pdf"
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error during PDF export"
      return {
        success: false,
        data: null,
        error: errorMessage,
        filename: options.filename || "gantt-chart.pdf"
      }
    }
  }

  /**
   * Exports the chart in PNG format
   *
   * @param element - DOM element to export
   * @param options - Export options
   * @returns Promise with the export result
   */
  const exportToPng = async (
    element: HTMLElement,
    wrapper: HTMLElement,
    options: ExportOptions
  ): Promise<ExportResult> => {
    try {
      const processedElement = prepareElementForExport(element, wrapper, options)

      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.width = element.offsetWidth + "px"
      tempContainer.style.height = element.offsetHeight + "px"
      tempContainer.style.overflow = "hidden"
      tempContainer.appendChild(processedElement)
      document.body.appendChild(tempContainer)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const scale = options.scale || 2

      const canvas = await html2canvas(processedElement, {
        scale: scale,
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#ffffff",
        imageTimeout: 0,
        removeContainer: false,
        foreignObjectRendering: false
      })

      document.body.removeChild(tempContainer)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Error creating blob PNG"))
            }
          },
          "image/png",
          options.quality || 0.95
        )
      })

      return {
        success: true,
        data: blob,
        filename: options.filename || "gantt-chart.png"
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error exporting PNG"
      return {
        success: false,
        data: null,
        error: errorMessage,
        filename: options.filename || "gantt-chart.png"
      }
    }
  }

  /**
   * Exports the chart in SVG format
   *
   * @param element - DOM element to export
   * @param options - Export options
   * @returns Promise with the export result
   */
  const exportToSvg = async (
    element: HTMLElement,
    wrapper: HTMLElement,
    options: ExportOptions
  ): Promise<ExportResult> => {
    try {
      const processedElement = prepareElementForExport(element, wrapper, options)

      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.width = element.offsetWidth + "px"
      tempContainer.style.height = element.offsetHeight + "px"
      tempContainer.style.overflow = "hidden"
      tempContainer.appendChild(processedElement)
      document.body.appendChild(tempContainer)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(processedElement, {
        scale: options.scale || 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#ffffff",
        imageTimeout: 0,
        removeContainer: false,
        foreignObjectRendering: false
      })

      document.body.removeChild(tempContainer)

      const width = canvas.width
      const height = canvas.height

      const svgNS = "http://www.w3.org/2000/svg"
      const svgRoot = document.createElementNS(svgNS, "svg")
      svgRoot.setAttribute("width", width.toString())
      svgRoot.setAttribute("height", height.toString())
      svgRoot.setAttribute("viewBox", `0 0 ${width} ${height}`)
      svgRoot.setAttribute("xmlns", svgNS)
      svgRoot.setAttribute("version", "1.1")

      const img = document.createElementNS(svgNS, "image")
      img.setAttribute("width", width.toString())
      img.setAttribute("height", height.toString())
      img.setAttribute("x", "0")
      img.setAttribute("y", "0")
      img.setAttribute("href", canvas.toDataURL("image/png", options.quality || 0.95))

      svgRoot.appendChild(img)

      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgRoot)

      const finalSvgString = '<?xml version="1.0" standalone="no"?>\n' + svgString

      const blob = new Blob([finalSvgString], { type: "image/svg+xml;charset=utf-8" })

      return {
        success: true,
        data: blob,
        filename: options.filename || "gantt-chart.svg"
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error exporting in SVG"
      return {
        success: false,
        data: null,
        error: errorMessage,
        filename: options.filename || "gantt-chart.svg"
      }
    }
  }

  /**
   * Exports the chart data in Excel format
   *
   * @param element - DOM element to export
   * @param options - Export options
   * @returns Promise with the export result
   */
  const exportToExcel = async (options: ExportOptions): Promise<ExportResult> => {
    try {
      const workbook = XLSX.utils.book_new()

      const getAllRows = (rows: ChartRow[]): ChartRow[] => {
        return rows.flatMap((row) => {
          if (!row.children?.length) {
            return [row]
          }
          return [row, ...getAllRows(row.children)]
        })
      }

      const allRows = getAllRows(rowManager.rows.value)

      const firstSheetData = [] as any[][]
      firstSheetData.push(["ID", "Task", "Start Date", "End Date", "Duration", "Progress (%)"])

      allRows.forEach((row, index) => {
        let startDate = "-"
        let endDate = "-"
        let duration = "-"
        let progress = "-"

        if (row.bars && row.bars.length > 0) {
          const minStartDate = row.bars.reduce(
            (min, bar) => {
              const currentStart = dayjs(bar[config.barStart.value])
              return !min || currentStart.isBefore(min) ? currentStart : min
            },
            null as dayjs.Dayjs | null
          )

          const maxEndDate = row.bars.reduce(
            (max, bar) => {
              const currentEnd = dayjs(bar[config.barEnd.value])
              return !max || currentEnd.isAfter(max) ? currentEnd : max
            },
            null as dayjs.Dayjs | null
          )

          if (minStartDate) {
            startDate = minStartDate.format(config.dateFormat.value || "YYYY-MM-DD HH:mm")
          }

          if (maxEndDate) {
            endDate = maxEndDate.format(config.dateFormat.value || "YYYY-MM-DD HH:mm")
          }

          if (minStartDate && maxEndDate) {
            const durationValue = maxEndDate.diff(minStartDate, config.precision.value)
            duration = `${durationValue}${config.precision.value.charAt(0)}`
          }

          const progressValues = row.bars
            .map((bar) => bar.ganttBarConfig.progress)
            .filter((progress): progress is number => progress !== undefined)

          if (progressValues.length > 0) {
            const avgProgress =
              progressValues.reduce((sum, curr) => sum + curr, 0) / progressValues.length
            progress = `${Math.round(avgProgress)}%`
          }
        }

        firstSheetData.push([
          row.id || index + 1,
          row.label,
          startDate,
          endDate,
          duration,
          progress
        ])
      })

      const worksheet1 = XLSX.utils.aoa_to_sheet(firstSheetData)
      XLSX.utils.book_append_sheet(workbook, worksheet1, "Gantt Rows")

      const secondSheetData = [] as any[][]
      secondSheetData.push([
        "Bar ID",
        "Label",
        "Parent Row",
        "Row ID",
        "Start Date",
        "End Date",
        "Duration",
        "Progress (%)",
        "Connections",
        "Milestone"
      ])

      const processedBarIds = new Set<string>()

      const allBars: {
        bar: GanttBarObject
        rowLabel: string
        rowId: string | number
      }[] = []

      const collectBars = (rows: ChartRow[]) => {
        rows.forEach((row) => {
          row.bars.forEach((bar) => {
            if (!processedBarIds.has(bar.ganttBarConfig.id)) {
              processedBarIds.add(bar.ganttBarConfig.id)
              allBars.push({
                bar,
                rowLabel: row.label,
                rowId: row.id || ""
              })
            }
          })

          if (row.children && row.children.length > 0) {
            collectBars(row.children)
          }
        })
      }

      collectBars(rowManager.rows.value)

      allBars.forEach((item) => {
        const { bar, rowLabel, rowId } = item
        const barConfig = bar.ganttBarConfig

        const startDate = dayjs(bar[config.barStart.value]).format(
          config.dateFormat.value || "YYYY-MM-DD HH:mm"
        )

        const endDate = dayjs(bar[config.barEnd.value]).format(
          config.dateFormat.value || "YYYY-MM-DD HH:mm"
        )

        const durationValue = dayjs(bar[config.barEnd.value]).diff(
          dayjs(bar[config.barStart.value]),
          config.precision.value
        )

        const duration = `${durationValue}${config.precision.value.charAt(0)}`

        const progress =
          barConfig.progress !== undefined ? `${Math.round(barConfig.progress)}%` : "-"

        const connections =
          barConfig.connections && barConfig.connections.length > 0
            ? barConfig.connections.map((conn) => conn.targetId).join(", ")
            : "-"

        const milestone = barConfig.milestoneId ? barConfig.milestoneId : "-"

        secondSheetData.push([
          barConfig.id,
          barConfig.label || "",
          rowLabel,
          rowId,
          startDate,
          endDate,
          duration,
          progress,
          connections,
          milestone
        ])
      })

      const worksheet2 = XLSX.utils.aoa_to_sheet(secondSheetData)
      XLSX.utils.book_append_sheet(workbook, worksheet2, "Bars Detail")
      ;[worksheet1, worksheet2].forEach((worksheet) => {
        const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
          if (!worksheet[cellRef]) worksheet[cellRef] = {}
          worksheet[cellRef].s = { font: { bold: true } }
        }
      })

      const colWidths1 = [
        { wch: 10 },
        { wch: 40 },
        { wch: 20 },
        { wch: 20 },
        { wch: 10 },
        { wch: 15 }
      ]
      worksheet1["!cols"] = colWidths1

      const colWidths2 = [
        { wch: 15 },
        { wch: 30 },
        { wch: 30 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 10 },
        { wch: 15 },
        { wch: 30 },
        { wch: 20 }
      ]
      worksheet2["!cols"] = colWidths2

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })

      return {
        success: true,
        data: blob,
        filename: options.filename || "gantt-chart.xlsx"
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error exporting to Excel"
      console.error("Error during Excel export:", error)
      return {
        success: false,
        data: null,
        error: errorMessage,
        filename: options.filename || "gantt-chart.xlsx"
      }
    }
  }

  /**
   * Downloads the export result
   *
   * @param result - Export result
   */
  const downloadExport = (result: ExportResult): void => {
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data)
      const link = document.createElement("a")
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return {
    exportChart,
    downloadExport,
    isExporting,
    lastError
  }
}
