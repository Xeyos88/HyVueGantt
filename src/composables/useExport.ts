import { ref, type Ref } from "vue"
import type { ChartRow, ExportOptions, ExportResult, GanttBarObject, TimeUnit } from "../types"
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
    locale?: Ref<string>
    precision: Ref<TimeUnit>
  }
) {
  const toDayjs = (input: string | Date) => dayjs(input).locale(config.locale?.value ?? "en")
  const isExporting = ref(false)
  const lastError = ref<string | null>(null)

  /** Capture in html2canvas's cloned document, retaining ancestor styles and slots. */
  const captureChart = async (
    html2canvas: (typeof import("html2canvas"))["default"],
    element: HTMLElement,
    wrapper: HTMLElement,
    options: ExportOptions,
    scale: number
  ) => {
    await document.fonts?.ready
    const timelineWidth = element.offsetWidth
    const timelineHeight = element.offsetHeight
    const labels = wrapper.querySelector<HTMLElement>(".g-gantt-label-section")
    const labelWidth =
      options.exportColumnLabel === false ? 0 : (labels?.offsetWidth ?? 0)
    return html2canvas(wrapper, {
      scale,
      logging: false,
      useCORS: true,
      backgroundColor: "#ffffff",
      removeContainer: true,
      onclone: async (clonedDocument, clonedWrapper) => {
        await clonedDocument.fonts?.ready
        // html2canvas can paint CSS shadows over the fill, darkening event bands.
        // Omit decorative shadows in the captured copy to preserve theme colors.
        clonedWrapper.querySelectorAll<HTMLElement>("*").forEach((node) => {
          node.style.boxShadow = "none"
        })
        // Only the cloned layout expands: the live chart keeps its viewport and scroll.
        Object.assign(clonedWrapper.style, {
          width: `${timelineWidth + labelWidth}px`,
          height: `${timelineHeight}px`,
          minWidth: "0",
          maxWidth: "none",
          minHeight: "0",
          maxHeight: "none",
          boxSizing: "content-box",
          flex: "none"
        })
        clonedWrapper
          .querySelectorAll<HTMLElement>(".g-gantt-command")
          .forEach((command) => {
            command.style.display = "none"
          })
        const clonedLabels = clonedWrapper.querySelector<HTMLElement>(
          ".g-gantt-label-section"
        )
        if (clonedLabels) {
          if (options.exportColumnLabel === false)
            clonedLabels.style.display = "none"
          else
            Object.assign(clonedLabels.style, {
              width: `${labelWidth}px`,
              flex: `0 0 ${labelWidth}px`
            })
        }
        const layout = clonedWrapper.querySelector<HTMLElement>(
          ".g-gantt-main-layout"
        )
        if (layout)
          Object.assign(layout.style, {
            overflow: "visible",
            flex: "none",
            height: `${timelineHeight}px`
          })
        const viewport =
          clonedWrapper.querySelector<HTMLElement>(".gantt-wrapper")
        if (viewport) {
          Object.assign(viewport.style, {
            width: `${timelineWidth}px`,
            flex: `0 0 ${timelineWidth}px`,
            overflow: "visible"
          })
          viewport.scrollLeft = 0
        }
        clonedWrapper
          .querySelectorAll<HTMLElement>(
            ".g-gantt-rows-container, .g-label-column-rows"
          )
          .forEach((rows) => {
            rows.scrollTop = 0
          })
      }
    })
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
    let pageCanvas: HTMLCanvasElement | undefined
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ])
      const scale = options.scale ?? 1
      const margin = options.margin ?? 10
      if (!Number.isFinite(scale) || scale <= 0) {
        throw new Error("PDF scale must be a finite positive number")
      }
      if (!Number.isFinite(margin) || margin < 0) {
        throw new Error("PDF margin must be a finite non-negative number")
      }
      const pdf = new jsPDF({
        orientation: options.orientation || "landscape",
        unit: "mm",
        format: options.paperSize || "a4"
      })
      // jsPDF already applies the requested orientation to these dimensions.
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2
      const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2
      if (pdfWidth <= 0 || pdfHeight <= 0) {
        throw new Error("PDF margin leaves no printable area")
      }

      const canvas = await captureChart(html2canvas, element, wrapper, options, scale)
      if (!canvas.width || !canvas.height) {
        throw new Error("Cannot export an empty chart to PDF")
      }

      // Integer source boundaries cover every pixel exactly once, without overlap.
      const pagePixels = Math.floor((pdfHeight / pdfWidth) * canvas.width)
      if (pagePixels < 1) {
        throw new Error("PDF printable height is too small for one image pixel")
      }
      if (canvas.height > pagePixels) pageCanvas = document.createElement("canvas")
      for (let top = 0; top < canvas.height; top += pagePixels) {
        const height = Math.min(pagePixels, canvas.height - top)
        let image = canvas
        if (pageCanvas) {
          pageCanvas.width = canvas.width
          pageCanvas.height = height
          const context = pageCanvas.getContext("2d")
          if (!context) throw new Error("Cannot create a canvas for PDF pagination")
          context.drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height)
          image = pageCanvas
        }
        if (top > 0) pdf.addPage()
        pdf.addImage(
          image.toDataURL("image/jpeg", options.quality ?? 0.95),
          "JPEG",
          margin,
          margin,
          pdfWidth,
          (height / canvas.width) * pdfWidth,
          undefined,
          "FAST"
        )
      }

      return {
        success: true,
        data: pdf.output("blob"),
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
    } finally {
      if (pageCanvas) {
        pageCanvas.width = 0
        pageCanvas.height = 0
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
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await captureChart(html2canvas, element, wrapper, options, options.scale ?? 2)

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
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await captureChart(html2canvas, element, wrapper, options, options.scale ?? 2)

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
      const xlsx = await import("@e965/xlsx").catch(() => {
        throw new Error(
          'Excel export requires the "@e965/xlsx" peer dependency. Install it to enable this feature.'
        )
      })
      const { utils, write } = xlsx

      const workbook = utils.book_new()

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
              const currentStart = toDayjs(bar[config.barStart.value])
              return !min || currentStart.isBefore(min) ? currentStart : min
            },
            null as dayjs.Dayjs | null
          )

          const maxEndDate = row.bars.reduce(
            (max, bar) => {
              const currentEnd = toDayjs(bar[config.barEnd.value])
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

      const worksheet1 = utils.aoa_to_sheet(firstSheetData)
      utils.book_append_sheet(workbook, worksheet1, "Gantt Rows")

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
        "Milestone",
        "Start Planned",
        "End Planned"
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

        const startDate = toDayjs(bar[config.barStart.value]).format(
          config.dateFormat.value || "YYYY-MM-DD HH:mm"
        )

        const endDate = toDayjs(bar[config.barEnd.value]).format(
          config.dateFormat.value || "YYYY-MM-DD HH:mm"
        )

        const durationValue = toDayjs(bar[config.barEnd.value]).diff(
          toDayjs(bar[config.barStart.value]),
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

        // Handle planned dates
        const startPlanned = bar.start_planned 
          ? toDayjs(bar.start_planned).format(config.dateFormat.value || "YYYY-MM-DD HH:mm")
          : "-"
        const endPlanned = bar.end_planned 
          ? toDayjs(bar.end_planned).format(config.dateFormat.value || "YYYY-MM-DD HH:mm")
          : "-"

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
          milestone,
          startPlanned,
          endPlanned
        ])
      })

      const worksheet2 = utils.aoa_to_sheet(secondSheetData)
      utils.book_append_sheet(workbook, worksheet2, "Bars Detail")
      ;[worksheet1, worksheet2].forEach((worksheet) => {
        const headerRange = utils.decode_range(worksheet["!ref"] || "A1")
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellRef = utils.encode_cell({ r: 0, c: col })
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

      const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" })
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
