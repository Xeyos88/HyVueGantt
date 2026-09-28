import { describe, expect, it } from "vitest"
import { ref } from "vue"
import { useVirtualRows } from "../../src/composables/useVirtualRows"
import type { ChartRow } from "../../src/types"

const makeRows = (count: number): ChartRow[] =>
  Array.from({ length: count }, (_, id) => ({ id, label: String(id), bars: [] }))
const setup = () => {
  const rows = ref(makeRows(1000))
  const expanded = ref(new Set<string | number>())
  const options = { enabled: ref(true), rowHeight: ref(40), maxRows: ref(10), overscan: ref(5) }
  const virtual = useVirtualRows(rows, (id) => expanded.value.has(id), options)
  return { rows, expanded, options, ...virtual }
}

describe("useVirtualRows", () => {
  it("bounds the window at the start, fractional offsets, and the end", () => {
    const v = setup()
    expect(v.visibleRows.value).toHaveLength(15)
    v.scrollTop.value = 20001
    expect(v.window.value).toMatchObject({ start: 495, end: 516, top: 19800, bottom: 19360 })
    v.scrollTop.value = 999999
    expect(v.window.value).toMatchObject({ start: 985, end: 1000, scrollTop: 39600 })
    expect(v.visibleRows.value.at(-1)?.row.id).toBe(999)
  })

  it("flattens expanded groups, including numeric id zero, with depth and parents", () => {
    const v = setup()
    v.rows.value = [
      {
        id: 0,
        label: "Group",
        bars: [],
        children: [
          {
            id: 1,
            label: "Nested",
            bars: [],
            children: makeRows(3).map((row) => ({ ...row, id: row.id + "-child" }))
          }
        ]
      }
    ]
    expect(v.flatRows.value).toHaveLength(1)
    v.expanded.value.add(0)
    v.expanded.value.add(1)
    expect(v.flatRows.value.map((entry) => entry.depth)).toEqual([0, 1, 2, 2, 2])
    expect(v.flatRows.value[2]?.parent?.row.id).toBe(1)
    v.expanded.value.delete(0)
    expect(v.flatRows.value).toHaveLength(1)
  })

  it("clamps the offset when data, row height or viewport size change", () => {
    const v = setup()
    v.scrollTop.value = 39600
    v.rows.value = makeRows(20)
    expect(v.window.value.scrollTop).toBe(400)
    v.options.rowHeight.value = 20
    expect(v.window.value.scrollTop).toBe(200)
    v.options.maxRows.value = 30
    expect(v.window.value.scrollTop).toBe(0)
    v.rows.value = []
    expect(v.visibleRows.value).toEqual([])
    expect(v.window.value.bottom).toBe(0)
  })

  it("renders all rows during interactions and export, then restores the window", () => {
    const v = setup()
    v.scrollTop.value = 20000
    v.interacting.value = true
    expect(v.visibleRows.value).toHaveLength(1000)
    v.interacting.value = false
    expect(v.visibleRows.value).toHaveLength(20)
    v.exporting.value = true
    expect(v.visibleRows.value).toHaveLength(1000)
    v.exporting.value = false
    expect(v.window.value.start).toBe(495)
    v.options.enabled.value = false
    expect(v.visibleRows.value).toHaveLength(1000)
    v.options.enabled.value = true
    v.options.maxRows.value = 0
    expect(v.enabled.value).toBe(false)
  })
})
