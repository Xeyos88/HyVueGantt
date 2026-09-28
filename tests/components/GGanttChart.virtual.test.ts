import { afterEach, describe, expect, it, vi } from "vitest"
import { mount, type VueWrapper } from "@vue/test-utils"
import { h, nextTick, ref } from "vue"
import { extendDayjs, GGanttChart, GGanttRow } from "../../src/hy-vue-gantt"
import type { ChartRow } from "../../src/types"
import GGanttConnector from "../../src/components/GGanttConnector.vue"

const { exportMock } = vi.hoisted(() => ({ exportMock: vi.fn() }))
vi.mock("../../src/composables/useExport", () => ({
  useExport: () => ({ exportChart: exportMock, isExporting: ref(false), downloadExport: vi.fn() })
}))
extendDayjs()
const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  exportMock.mockReset()
})
const makeRows = (count: number): ChartRow[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    label: `Row ${String(i).padStart(4, "0")}`,
    bars: [
      {
        start: "2024-01-02 00:00",
        end: "2024-01-03 00:00",
        ganttBarConfig: { id: `bar-${i}`, label: `Bar ${i}` }
      }
    ]
  }))
const setup = async (rows = makeRows(1000), extraProps = {}, slots = {}) => {
  const wrapper = mount(GGanttChart, {
    attachTo: document.body,
    props: {
      chartStart: "2024-01-01 00:00",
      chartEnd: "2024-01-05 00:00",
      barStart: "start",
      barEnd: "end",
      virtualRows: true,
      maxRows: 10,
      rowHeight: 40,
      virtualRowsOverscan: 2,
      labelColumnTitle: "Tasks",
      initialRows: rows,
      ...extraProps
    },
    slots
  })
  wrappers.push(wrapper)
  await nextTick()
  return wrapper
}
const scroll = async (wrapper: VueWrapper, top: number, label = false) => {
  const el = wrapper.get<HTMLElement>(label ? ".g-label-column-rows" : ".g-gantt-rows-container")
  el.element.scrollTop = top
  await el.trigger("scroll")
  await nextTick()
}

describe("virtual chart rows", () => {
  it("mounts a bounded set and keeps both columns aligned when scrolling from either side", async () => {
    const w = await setup()
    expect(w.findAll(".g-gantt-row")).toHaveLength(12)
    expect(w.findAll(".g-label-column-row")).toHaveLength(12)
    await scroll(w, 20000)
    expect(w.findAll(".g-gantt-row")).toHaveLength(14)
    expect(w.get(".g-gantt-row").attributes("data-row-id")).toBe("row-498")
    expect(w.get(".g-label-column-row").attributes("data-row-id")).toBe("row-498")
    expect(w.get<HTMLElement>(".g-label-column-rows").element.scrollTop).toBe(20000)
    await scroll(w, 39600, true)
    expect(w.findAll(".g-gantt-row").at(-1)?.attributes("data-row-id")).toBe("row-999")
    await w.setProps({ initialRows: makeRows(5) })
    await nextTick()
    expect(w.findAll(".g-gantt-row")).toHaveLength(5)
    expect(w.get<HTMLElement>(".g-gantt-rows-container").element.scrollTop).toBe(0)
  })

  it("preserves group bars and child slots and clamps scroll on collapse", async () => {
    const children = makeRows(100)
    const w = await setup(
      [],
      {},
      {
        default: () =>
          h(
            GGanttRow,
            {
              id: "group",
              label: "Group",
              bars: [],
              children
            },
            { "bar-label": () => h("span", { class: "custom-label" }, "Custom") }
          )
      }
    )
    w.vm.expandAllGroups()
    await nextTick()
    expect(w.findAll(".g-gantt-row")).toHaveLength(12)
    expect(w.findAll(".g-gantt-row-group")).toHaveLength(1)
    expect(w.find(".custom-label").exists()).toBe(true)
    await scroll(w, 3000)
    expect(w.find(".custom-label").exists()).toBe(true)
    w.vm.collapseAllGroups()
    await nextTick()
    await nextTick()
    expect(w.findAll(".g-gantt-row")).toHaveLength(1)
    expect(w.findAll(".g-label-column-row")).toHaveLength(1)
    expect(w.get<HTMLElement>(".g-gantt-rows-container").element.scrollTop).toBe(0)
  })

  it("retains connections to unmounted bars and positions them after zoom", async () => {
    const rows = makeRows(100)
    rows[0]!.bars[0]!.ganttBarConfig.connections = [{ targetId: "bar-99" }]
    const w = await setup(rows)
    await nextTick()
    expect(w.find("#bar-99").exists()).toBe(false)
    const connector = w.getComponent(GGanttConnector)
    expect(connector.props("targetBar").y).toBe(3966)
    const width = connector.props("targetBar").width
    w.vm.restoreZoom(6, "day")
    await nextTick()
    expect(w.getComponent(GGanttConnector).props("targetBar").width).toBe(width * 2)
    await scroll(w, 2000)
    expect(w.find("#bar-0").exists()).toBe(false)
    expect(w.find("#bar-99").exists()).toBe(false)
    expect(w.findComponent(GGanttConnector).exists()).toBe(true)
  })

  it("renders all expanded rows for export and restores virtualization even on failure", async () => {
    const w = await setup(makeRows(100), { commands: false })
    await scroll(w, 2000)
    exportMock.mockImplementationOnce(async () => {
      expect(w.findAll(".g-gantt-row")).toHaveLength(100)
      expect(w.findAll(".g-label-column-row")).toHaveLength(100)
      expect(w.get<HTMLElement>(".g-gantt-rows-container").element.style.maxHeight).toBe("")
      throw new Error("export failed")
    })
    await expect(w.vm.exportChart({ format: "png" })).rejects.toThrow("export failed")
    expect(w.findAll(".g-gantt-row")).toHaveLength(14)
    expect(w.get<HTMLElement>(".g-gantt-rows-container").element.scrollTop).toBe(2000)
    exportMock.mockResolvedValueOnce({ success: true })
    await w.vm.exportChart({ format: "excel" })
    expect(w.findAll(".g-gantt-row")).toHaveLength(14)
  })

  it("keeps active rows mounted through a drag and restores the window on release", async () => {
    const w = await setup(makeRows(100))
    await w.get(".g-gantt-row").trigger("mousedown")
    expect(w.findAll(".g-gantt-row")).toHaveLength(100)
    await scroll(w, 3000)
    expect(w.find("#bar-0").exists()).toBe(true)
    window.dispatchEvent(new MouseEvent("mouseup"))
    await nextTick()
    await nextTick()
    expect(w.findAll(".g-gantt-row")).toHaveLength(14)
    expect(w.find("#bar-0").exists()).toBe(false)
  })

  it("preserves expanded children when switching to the default recursive renderer", async () => {
    const w = await setup([{ id: "group", label: "Group", bars: [], children: makeRows(20) }])
    w.vm.expandAllGroups()
    await nextTick()
    expect(w.findAll(".g-gantt-row")).toHaveLength(12)
    await w.setProps({ virtualRows: false })
    expect(w.findAll(".g-gantt-row")).toHaveLength(21)
    expect(w.findAll(".g-label-column-row")).toHaveLength(21)
    await w.setProps({ virtualRows: true })
    expect(w.findAll(".g-gantt-row")).toHaveLength(12)
  })

  it("supports disabling virtualization and charts without a row viewport", async () => {
    const w = await setup(makeRows(30))
    await w.setProps({ virtualRows: false })
    expect(w.findAll(".g-gantt-row")).toHaveLength(30)
    await w.setProps({ virtualRows: true, maxRows: 0 })
    expect(w.findAll(".g-gantt-row")).toHaveLength(30)
  })
})
