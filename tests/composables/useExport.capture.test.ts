import { afterEach, expect, it, vi } from "vitest"
import { ref } from "vue"
import html2canvas from "html2canvas"
import { useExport } from "../../src/composables/useExport"
import type { UseRowsReturn } from "../../src/composables/useRows"
vi.mock("html2canvas", () => ({ default: vi.fn() }))
afterEach(() => {
  document.body.innerHTML = ""
  vi.clearAllMocks()
})

it.each([true, false])(
  "preserves the CSS context and expands only the cloned timeline (labels=%s)",
  async (exportColumnLabel) => {
    const ancestor = document.createElement("section")
    ancestor.className = "consumer-theme"
    ancestor.innerHTML = `<style>.consumer-theme .badge { color: rgb(255, 255, 255); font-size: 14px; }</style>
  <div class="wrapper"><div class="g-gantt-main-layout">
    <div class="g-gantt-label-section"></div>
    <div class="gantt-wrapper"><div class="g-gantt-chart"><span class="badge">Label</span></div></div>
  </div><div class="g-gantt-command">Commands</div></div>`
    document.body.appendChild(ancestor)
    const wrapper = ancestor.querySelector<HTMLElement>(".wrapper")!
    const chart = ancestor.querySelector<HTMLElement>(".g-gantt-chart")!
    const labels = ancestor.querySelector<HTMLElement>(".g-gantt-label-section")!
    Object.defineProperties(chart, { offsetWidth: { value: 1200 }, offsetHeight: { value: 500 } })
    Object.defineProperty(labels, "offsetWidth", { value: 180 })
    const exporter = useExport(
      () => chart,
      () => wrapper,
      { rows: ref([]) } as unknown as UseRowsReturn,
      { barStart: ref("start"), barEnd: ref("end"), dateFormat: ref(false), precision: ref("day") }
    )
    vi.mocked(html2canvas).mockImplementation(async (source, options) => {
      expect(source).toBe(wrapper) // Capture the actual element with its ancestor selectors.
      const clone = ancestor.cloneNode(true) as HTMLElement
      document.body.appendChild(clone)
      const copy = clone.querySelector<HTMLElement>(".wrapper")!
      await options!.onclone!(document, copy)
      expect(copy.style.width).toBe(exportColumnLabel ? "1380px" : "1200px")
      expect(copy.style.height).toBe("500px")
      expect(copy.querySelector<HTMLElement>(".gantt-wrapper")!.style.flex).toBe("0 0 1200px")
      const badge = copy.querySelector<HTMLElement>(".badge")!
      expect(getComputedStyle(badge).color).toBe("rgb(255, 255, 255)")
      expect(getComputedStyle(badge).fontSize).toBe("14px")
      expect(badge.style.transform).toBe("")
      expect(copy.querySelector<HTMLElement>(".g-gantt-command")!.style.display).toBe("none")
      expect(copy.querySelector<HTMLElement>(".g-gantt-label-section")!.style.display).toBe(
        exportColumnLabel ? "" : "none"
      )
      expect(wrapper.style.width).toBe("")
      expect(wrapper.querySelector<HTMLElement>(".g-gantt-command")!.style.display).toBe("")
      clone.remove()
      return {
        toBlob: (callback: BlobCallback) => callback(new Blob(["png"]))
      } as HTMLCanvasElement
    })
    const result = await exporter.exportChart({ format: "png", exportColumnLabel })
    expect(result.success).toBe(true)
  }
)
