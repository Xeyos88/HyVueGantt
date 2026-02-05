import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useExport } from "../../src/composables/useExport"
import type { ExportOptions, ChartRow, TimeUnit } from "../../src/types"
import type { UseRowsReturn } from "../../src/composables/useRows"

// Mock external dependencies
vi.mock("html2canvas", () => ({
  default: vi.fn()
}))

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 297,
        getHeight: () => 210
      }
    },
    addPage: vi.fn(),
    addImage: vi.fn(),
    output: vi.fn().mockReturnValue(new Blob())
  }))
}))

vi.mock("xlsx", () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    decode_range: vi.fn(() => ({ s: { c: 0 }, e: { c: 5 } })),
    encode_cell: vi.fn(() => "A1")
  },
  write: vi.fn(() => new ArrayBuffer(8))
}))

import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"

describe("useExport", () => {
  let mockGetChartElement: () => HTMLElement | null
  let mockGetWrapperElement: () => HTMLElement | null
  let mockRowManager: UseRowsReturn
  let mockConfig: any
  let exportComposable: ReturnType<typeof useExport>

  const mockChartRows: ChartRow[] = [
    {
      id: "1",
      label: "Task 1",
      bars: [
        {
          start: "2024-01-01",
          end: "2024-01-03",
          ganttBarConfig: {
            id: "bar1",
            label: "Bar 1",
            progress: 50,
            connections: [{ targetId: "bar2", type: "straight" }]
          }
        }
      ]
    },
    {
      id: "2",
      label: "Task 2",
      bars: [
        {
          start: "2024-01-02",
          end: "2024-01-04",
          ganttBarConfig: {
            id: "bar2",
            label: "Bar 2",
            progress: 75,
            milestoneId: "milestone1"
          }
        }
      ],
      children: [
        {
          id: "3",
          label: "Subtask 1",
          bars: [
            {
              start: "2024-01-02",
              end: "2024-01-03",
              ganttBarConfig: {
                id: "bar3",
                label: "Bar 3",
                progress: 100
              }
            }
          ]
        }
      ]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock DOM elements
    const mockChartElement = document.createElement("div")
    mockChartElement.style.width = "800px"
    mockChartElement.style.height = "600px"
    Object.defineProperty(mockChartElement, 'offsetWidth', { value: 800 })
    Object.defineProperty(mockChartElement, 'offsetHeight', { value: 600 })

    const mockWrapperElement = document.createElement("div")
    mockWrapperElement.innerHTML = `
      <div class="g-gantt-command"></div>
      <div class="g-gantt-label-section"></div>
      <div class="g-gantt-bar-label"><div>Bar Label</div></div>
      <div class="g-timeunit-min">Time Unit</div>
      <div class="label-unit">Label Unit</div>
      <div class="cell-content">Cell Content</div>
      <div class="text-ellipsis">Ellipsis Text</div>
      <div class="g-label-column-row">Column Row</div>
      <div class="g-gantt-progress-bar">Progress</div>
      <div class="progress-text">Progress Text</div>
      <div class="g-timeaxis-event-label">Event Label</div>
      <div class="g-gantt-milestone-label">Milestone Label</div>
      <div class="g-gantt-milestone-marker">Milestone Marker</div>
      <div class="g-gantt-row-label">Row Label</div>
    `

    mockGetChartElement = vi.fn().mockReturnValue(mockChartElement)
    mockGetWrapperElement = vi.fn().mockReturnValue(mockWrapperElement)

    mockRowManager = {
      rows: ref(mockChartRows)
    } as any

    mockConfig = {
      barStart: ref("start"),
      barEnd: ref("end"),
      dateFormat: ref("YYYY-MM-DD"),
      precision: ref("day" as TimeUnit)
    }

    exportComposable = useExport(
      mockGetChartElement,
      mockGetWrapperElement,
      mockRowManager,
      mockConfig
    )

    // Mock canvas for html2canvas
    const mockCanvas = {
      width: 800,
      height: 600,
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock"),
      toBlob: vi.fn().mockImplementation((callback) => {
        callback(new Blob())
      })
    }

    vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any)

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url")
    global.URL.revokeObjectURL = vi.fn()

    // Mock XMLSerializer for SVG export
    global.XMLSerializer = vi.fn().mockImplementation(() => ({
      serializeToString: vi.fn().mockReturnValue("<svg></svg>")
    }))

    // Mock document.createElementNS for SVG
    const mockSvgElement = {
      setAttribute: vi.fn(),
      appendChild: vi.fn()
    }
    const originalCreateElementNS = document.createElementNS
    document.createElementNS = vi.fn().mockReturnValue(mockSvgElement as any)

    // Clean up after tests
    afterEach(() => {
      document.createElementNS = originalCreateElementNS
    })
  })

  describe("basic initialization", () => {
    it("should initialize with correct default state", () => {
      expect(exportComposable.isExporting.value).toBe(false)
      expect(exportComposable.lastError.value).toBeNull()
    })
  })

  describe("element preparation", () => {
    it("should prepare element for export with default options", async () => {
      const options: ExportOptions = {
        format: "png",
        exportColumnLabel: true
      }

      const result = await exportComposable.exportChart(options)

      expect(html2canvas).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it("should hide column labels when exportColumnLabel is false", async () => {
      const options: ExportOptions = {
        format: "png",
        exportColumnLabel: false
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
      expect(html2canvas).toHaveBeenCalled()
    })
  })

  // describe("PDF export", () => {
  //   it("should export to PDF successfully", async () => {
  //     const options: ExportOptions = {
  //       format: "pdf",
  //       filename: "test-gantt",
  //       paperSize: "a4",
  //       orientation: "landscape",
  //       scale: 1,
  //       margin: 10,
  //       quality: 0.95
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(true)
  //     expect(result.data).toBeInstanceOf(Blob)
  //     expect(result.filename).toBe("test-gantt.pdf")
  //     expect(jsPDF).toHaveBeenCalledWith({
  //       orientation: "landscape",
  //       unit: "mm",
  //       format: "a4"
  //     })
  //   })

  //   it("should export to PDF with portrait orientation", async () => {
  //     const options: ExportOptions = {
  //       format: "pdf",
  //       orientation: "portrait"
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(true)
  //     expect(jsPDF).toHaveBeenCalledWith({
  //       orientation: "portrait",
  //       unit: "mm",
  //       format: "a4"
  //     })
  //   })

  //   it("should handle PDF export with multi-page content", async () => {
  //     // Mock a tall canvas that would require multiple pages
  //     const tallCanvas = {
  //       width: 800,
  //       height: 2000, // Very tall to trigger multi-page
  //       toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock")
  //     }

  //     vi.mocked(html2canvas).mockResolvedValueOnce(tallCanvas as any)

  //     const mockPdf = {
  //       internal: {
  //         pageSize: {
  //           getWidth: () => 210,
  //           getHeight: () => 297
  //         }
  //       },
  //       addPage: vi.fn(),
  //       addImage: vi.fn(),
  //       output: vi.fn().mockReturnValue(new Blob())
  //     }

  //     vi.mocked(jsPDF).mockReturnValueOnce(mockPdf as any)

  //     const options: ExportOptions = {
  //       format: "pdf"
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(true)
  //     expect(mockPdf.addPage).toHaveBeenCalled()
  //   })

  //   it("should handle PDF export errors", async () => {
  //     vi.mocked(html2canvas).mockRejectedValueOnce(new Error("Canvas error"))

  //     const options: ExportOptions = {
  //       format: "pdf"
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(false)
  //     expect(result.error).toBe("Canvas error")
  //   })
  // })

  // describe("PNG export", () => {
  //   it("should export to PNG successfully", async () => {
  //     const options: ExportOptions = {
  //       format: "png",
  //       filename: "test-gantt",
  //       scale: 2,
  //       quality: 0.9
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(true)
  //     expect(result.data).toBeInstanceOf(Blob)
  //     expect(result.filename).toBe("test-gantt.png")
  //     expect(html2canvas).toHaveBeenCalledWith(
  //       expect.any(HTMLElement),
  //       expect.objectContaining({
  //         scale: 2,
  //         logging: false,
  //         allowTaint: true,
  //         useCORS: true,
  //         backgroundColor: "#ffffff"
  //       })
  //     )
  //   })

  //   it("should handle PNG blob creation error", async () => {
  //     const mockCanvas = {
  //       width: 800,
  //       height: 600,
  //       toBlob: vi.fn().mockImplementation((callback) => {
  //         callback(null) // Simulate blob creation failure
  //       })
  //     }

  //     vi.mocked(html2canvas).mockResolvedValueOnce(mockCanvas as any)

  //     const options: ExportOptions = {
  //       format: "png"
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(false)
  //     expect(result.error).toBe("Error creating blob PNG")
  //   })

  //   it("should handle PNG export errors", async () => {
  //     vi.mocked(html2canvas).mockRejectedValueOnce(new Error("PNG export error"))

  //     const options: ExportOptions = {
  //       format: "png"
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(false)
  //     expect(result.error).toBe("PNG export error")
  //   })
  // })

  // describe("SVG export", () => {
  //   it("should export to SVG successfully", async () => {
  //     const options: ExportOptions = {
  //       format: "svg",
  //       filename: "test-gantt",
  //       scale: 2,
  //       quality: 0.8
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(true)
  //     expect(result.data).toBeInstanceOf(Blob)
  //     expect(result.filename).toBe("test-gantt.svg")
  //   })

  //   it("should handle SVG export errors", async () => {
  //     vi.mocked(html2canvas).mockRejectedValueOnce(new Error("SVG export error"))

  //     const options: ExportOptions = {
  //       format: "svg"
  //     }

  //     const result = await exportComposable.exportChart(options)

  //     expect(result.success).toBe(false)
  //     expect(result.error).toBe("SVG export error")
  //   })
  // })

  describe("Excel export", () => {
    it("should export to Excel successfully", async () => {
      const options: ExportOptions = {
        format: "excel",
        filename: "test-gantt"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Blob)
      expect(result.filename).toBe("test-gantt.xlsx")
      expect(XLSX.utils.book_new).toHaveBeenCalled()
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled()
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2) // Two sheets
    })

    it("should create correct Excel data structure", async () => {
      const options: ExportOptions = {
        format: "excel"
      }

      await exportComposable.exportChart(options)

      // Verify the first sheet (Gantt Rows) was created with proper headers
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining(["ID", "Task", "Start Date", "End Date", "Duration", "Progress (%)"])
        ])
      )

      // Verify the second sheet (Bars Detail) was created with proper headers
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining([
            "Bar ID", "Label", "Parent Row", "Row ID", "Start Date", "End Date", "Duration", "Progress (%)", "Connections", "Milestone"
          ])
        ])
      )
    })

    it("should handle rows with no bars in Excel export", async () => {
      const rowsWithEmptyBars: ChartRow[] = [
        {
          id: "1",
          label: "Empty Task",
          bars: []
        }
      ]

      mockRowManager.rows.value = rowsWithEmptyBars

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining(["1", "Empty Task", "-", "-", "-", "-"])
        ])
      )
    })

    it("should handle nested rows in Excel export", async () => {
      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
      // Should include both parent and child rows
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining([expect.any(String), "Task 1", expect.any(String), expect.any(String)]),
          expect.arrayContaining([expect.any(String), "Task 2", expect.any(String), expect.any(String)]),
          expect.arrayContaining([expect.any(String), "Subtask 1", expect.any(String), expect.any(String)])
        ])
      )
    })

    it("should calculate progress correctly in Excel export", async () => {
      const options: ExportOptions = {
        format: "excel"
      }

      await exportComposable.exportChart(options)

      // Check that progress values are properly formatted as percentages
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining([expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), "50%"])
        ])
      )
    })

    it("should handle Excel export errors", async () => {
      vi.mocked(XLSX.utils.book_new).mockImplementationOnce(() => {
        throw new Error("Excel error")
      })

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Excel error")
    })

    it("should handle different date formats in Excel export", async () => {
      mockConfig.dateFormat.value = "DD/MM/YYYY"

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
    })

    it("should handle false date format in Excel export", async () => {
      mockConfig.dateFormat.value = false

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
    })
  })

  describe("error handling", () => {
    it("should handle missing chart element", async () => {
      mockGetChartElement = vi.fn().mockReturnValue(null)

      const newExportComposable = useExport(
        mockGetChartElement,
        mockGetWrapperElement,
        mockRowManager,
        mockConfig
      )

      const options: ExportOptions = {
        format: "png"
      }

      const result = await newExportComposable.exportChart(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Gantt chart element not found")
    })

    it("should handle missing wrapper element", async () => {
      mockGetWrapperElement = vi.fn().mockReturnValue(null)

      const newExportComposable = useExport(
        mockGetChartElement,
        mockGetWrapperElement,
        mockRowManager,
        mockConfig
      )

      const options: ExportOptions = {
        format: "png"
      }

      const result = await newExportComposable.exportChart(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Gantt chart element not found")
    })

    it("should handle unsupported export format", async () => {
      const options: ExportOptions = {
        format: "unsupported" as any
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Format file export not supported: unsupported")
    })

    it("should set error state when export fails", async () => {
      vi.mocked(html2canvas).mockRejectedValueOnce(new Error("Test error"))

      const options: ExportOptions = {
        format: "png"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Test error")
    })

    it("should reset isExporting state even on error", async () => {
      vi.mocked(html2canvas).mockRejectedValueOnce(new Error("Test error"))

      expect(exportComposable.isExporting.value).toBe(false)

      const options: ExportOptions = {
        format: "png"
      }

      const resultPromise = exportComposable.exportChart(options)

      // During export, isExporting should be true
      expect(exportComposable.isExporting.value).toBe(true)

      await resultPromise

      // After error, should be false again
      expect(exportComposable.isExporting.value).toBe(false)
    })
  })

  describe("filename handling", () => {
    it("should use default filename when not provided", async () => {
      const options: ExportOptions = {
        format: "png"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.filename).toMatch(/gantt-export-\d{4}-\d{2}-\d{2}\.png/)
    })

    it("should use provided filename", async () => {
      const options: ExportOptions = {
        format: "pdf",
        filename: "custom-name"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.filename).toBe("custom-name.pdf")
    })
  })

  describe("download functionality", () => {
    it("should download successful export result", () => {
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn()
      }

      // Mock document.createElement for 'a' element
      const originalCreateElement = document.createElement
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === "a") {
          return mockLink
        }
        return originalCreateElement.call(document, tagName)
      })

      // Mock appendChild and removeChild
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()

      const successResult = {
        success: true,
        data: new Blob(),
        filename: "test.png"
      }

      exportComposable.downloadExport(successResult)

      expect(mockLink.download).toBe("test.png")
      expect(mockLink.click).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)
      expect(URL.revokeObjectURL).toHaveBeenCalled()

      // Restore original createElement
      document.createElement = originalCreateElement
    })

    it("should not download failed export result", () => {
      document.body.appendChild = vi.fn()

      const failedResult = {
        success: false,
        data: null,
        error: "Export failed",
        filename: "test.png"
      }

      exportComposable.downloadExport(failedResult)

      expect(document.body.appendChild).not.toHaveBeenCalled()
    })
  })

  describe("configuration handling", () => {
    it("should handle different precision settings", async () => {
      mockConfig.precision.value = "hour"

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
    })

    it("should handle different bar field names", async () => {
      mockConfig.barStart.value = "startDate"
      mockConfig.barEnd.value = "endDate"

      // Update mock data to use new field names
      mockRowManager.rows.value = [
        {
          id: "1",
          label: "Task 1",
          bars: [
            {
              startDate: "2024-01-01",
              endDate: "2024-01-03",
              ganttBarConfig: {
                id: "bar1",
                label: "Bar 1",
                progress: 50
              }
            }
          ]
        }
      ]

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("should handle empty rows in Excel export", async () => {
      mockRowManager.rows.value = []

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        ["ID", "Task", "Start Date", "End Date", "Duration", "Progress (%)"]
      ])
    })

    it("should handle bars without progress values", async () => {
      mockRowManager.rows.value = [
        {
          id: "1",
          label: "Task 1",
          bars: [
            {
              start: "2024-01-01",
              end: "2024-01-02",
              ganttBarConfig: {
                id: "bar1",
                label: "Bar 1"
                // No progress value
              }
            }
          ]
        }
      ]

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
    })

    it("should handle bars without connections", async () => {
      mockRowManager.rows.value = [
        {
          id: "1",
          label: "Task 1",
          bars: [
            {
              start: "2024-01-01",
              end: "2024-01-02",
              ganttBarConfig: {
                id: "bar1",
                label: "Bar 1"
                // No connections
              }
            }
          ]
        }
      ]

      const options: ExportOptions = {
        format: "excel"
      }

      const result = await exportComposable.exportChart(options)

      expect(result.success).toBe(true)
    })
  })
})
