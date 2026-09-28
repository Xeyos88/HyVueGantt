import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ref } from "vue"
import { useExport } from "../../src/composables/useExport"
import type { UseRowsReturn } from "../../src/composables/useRows"
import html2canvas from "html2canvas"

const state = vi.hoisted(() => ({
  width: 297,
  height: 210,
  addImage: vi.fn(),
  addPage: vi.fn(),
  output: vi.fn()
}))
vi.mock("html2canvas", () => ({ default: vi.fn() }))
vi.mock("jspdf", () => ({
  default: class {
    internal = { pageSize: { getWidth: () => state.width, getHeight: () => state.height } }
    addImage = state.addImage
    addPage = state.addPage
    output = state.output
    constructor({ orientation }: { orientation: string }) {
      state.width = orientation === "portrait" ? 210 : 297
      state.height = orientation === "portrait" ? 297 : 210
    }
  }
}))

const makeExporter = () => {
  const element = document.createElement("div")
  Object.defineProperties(element, { offsetWidth: { value: 800 }, offsetHeight: { value: 600 } })
  return useExport(
    () => element,
    () => element,
    { rows: ref([]) } as unknown as UseRowsReturn,
    {
      barStart: ref("start"),
      barEnd: ref("end"),
      dateFormat: ref(false),
      precision: ref("day")
    }
  )
}
const capturedCanvas = (width: number, height: number) => {
  const canvas = { width, height, toDataURL: vi.fn(() => "full-image") }
  vi.mocked(html2canvas).mockResolvedValue(canvas as unknown as HTMLCanvasElement)
  return canvas
}
let drawImage: ReturnType<typeof vi.fn>
let toDataURL: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  vi.clearAllMocks()
  state.output.mockReturnValue(new Blob(["pdf"], { type: "application/pdf" }))
  drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage
  } as unknown as CanvasRenderingContext2D)
  toDataURL = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(function () {
    const crop = drawImage.mock.calls.at(-1)!
    return `slice:${crop[2]}:${crop[4]}`
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ""
})

describe("PDF geometry and pagination", () => {
  it.each(["portrait", "landscape"] as const)(
    "fits a single page in %s without distortion",
    async (orientation) => {
      capturedCanvas(800, 400)
      const result = await makeExporter().exportChart({
        format: "pdf",
        orientation,
        filename: "chart"
      })
      expect(result.success).toBe(true)
      expect(result.filename).toBe("chart.pdf")
      expect(result.data?.type).toBe("application/pdf")
      const width = state.width - 20
      expect(state.addImage).toHaveBeenCalledExactlyOnceWith(
        "full-image",
        "JPEG",
        10,
        10,
        width,
        width / 2,
        undefined,
        "FAST"
      )
      expect(state.addPage).not.toHaveBeenCalled()
      expect(drawImage).not.toHaveBeenCalled()
    }
  )

  it.each(["portrait", "landscape"] as const)(
    "covers all source pixels exactly once across %s pages",
    async (orientation) => {
      const canvas = capturedCanvas(800, 3001)
      const result = await makeExporter().exportChart({ format: "pdf", orientation })
      expect(result.success).toBe(true)
      const width = state.width - 20
      const height = state.height - 20
      const perPage = Math.floor((height / width) * 800)
      const pageCount = Math.ceil(3001 / perPage)
      expect(state.addPage).toHaveBeenCalledTimes(pageCount - 1)
      expect(drawImage).toHaveBeenCalledTimes(pageCount)
      let covered = 0
      for (let i = 0; i < pageCount; i++) {
        const sliceHeight = Math.min(perPage, 3001 - covered)
        expect(drawImage.mock.calls[i]).toEqual([
          canvas,
          0,
          covered,
          800,
          sliceHeight,
          0,
          0,
          800,
          sliceHeight
        ])
        expect(state.addImage.mock.calls[i]).toEqual([
          `slice:${covered}:${sliceHeight}`,
          "JPEG",
          10,
          10,
          width,
          (sliceHeight / 800) * width,
          undefined,
          "FAST"
        ])
        expect(state.addImage.mock.calls[i][5]).toBeLessThanOrEqual(height)
        covered += sliceHeight
      }
      expect(covered).toBe(3001)
      expect(canvas.toDataURL).not.toHaveBeenCalled()
      expect(document.body.children).toHaveLength(0)
    }
  )

  it("does not add a blank page at an exact page boundary and honours zero margin/quality", async () => {
    capturedCanvas(297, 420)
    const result = await makeExporter().exportChart({ format: "pdf", margin: 0, quality: 0 })
    expect(result.success).toBe(true)
    expect(state.addImage).toHaveBeenCalledTimes(2)
    expect(state.addPage).toHaveBeenCalledTimes(1)
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0)
    expect(state.addImage.mock.calls[1]).toEqual([
      "slice:210:210",
      "JPEG",
      0,
      0,
      297,
      210,
      undefined,
      "FAST"
    ])
  })

  it.each([{ margin: -1 }, { margin: 105 }, { margin: Infinity }, { scale: 0 }, { scale: NaN }])(
    "rejects invalid geometry %j before capture",
    async (options) => {
      const result = await makeExporter().exportChart({ format: "pdf", ...options })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/PDF (margin|scale)/)
      expect(html2canvas).not.toHaveBeenCalled()
      expect(document.body.children).toHaveLength(0)
    }
  )

  it("cleans up capture failures and resets exporting state", async () => {
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error("capture failed"))
    const exporter = makeExporter()
    const result = await exporter.exportChart({ format: "pdf" })
    expect(result.error).toBe("capture failed")
    expect(exporter.isExporting.value).toBe(false)
    expect(document.body.children).toHaveLength(0)
  })

  it("cleans up when PDF encoding fails", async () => {
    capturedCanvas(800, 3001)
    state.addImage.mockImplementationOnce(() => {
      throw new Error("encoding failed")
    })
    const result = await makeExporter().exportChart({ format: "pdf" })
    expect(result.error).toBe("encoding failed")
    expect(document.body.children).toHaveLength(0)
  })

  it("reports unavailable canvas contexts", async () => {
    capturedCanvas(800, 3001)
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
    const result = await makeExporter().exportChart({ format: "pdf" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/canvas/)
    expect(document.body.children).toHaveLength(0)
  })

  it("rejects empty captures", async () => {
    capturedCanvas(0, 0)
    const result = await makeExporter().exportChart({ format: "pdf" })
    expect(result.error).toMatch(/empty chart/)
    expect(document.body.children).toHaveLength(0)
  })
})
