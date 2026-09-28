import { computed, ref, type Ref } from "vue"
import type { ChartRow } from "../types"

export interface VirtualRow {
  row: ChartRow
  index: number
  depth: number
  parent?: VirtualRow
}

/** One shared window keeps labels and timeline rows aligned. */
export function useVirtualRows(
  rows: Ref<ChartRow[]>,
  isExpanded: (id: string | number) => boolean,
  options: {
    enabled: Ref<boolean>
    rowHeight: Ref<number>
    maxRows: Ref<number>
    overscan: Ref<number>
  }
) {
  const scrollTop = ref(0)
  const interacting = ref(false)
  const exporting = ref(false)
  const enabled = computed(
    () => options.enabled.value && options.maxRows.value > 0 && options.rowHeight.value > 0
  )
  const flatRows = computed(() => {
    const result: VirtualRow[] = []
    const visit = (items: ChartRow[], depth: number, parent?: VirtualRow) => {
      for (const row of items) {
        const entry = { row, depth, index: result.length, parent }
        result.push(entry)
        if (row.children?.length && isExpanded(row.id)) visit(row.children, depth + 1, entry)
      }
    }
    visit(rows.value, 0)
    return result
  })
  const window = computed(() => {
    const count = flatRows.value.length
    const height = options.rowHeight.value
    const viewport = Math.max(1, Math.ceil(options.maxRows.value))
    const maxScroll = Math.max(0, (count - viewport) * height)
    const top = Math.min(maxScroll, Math.max(0, scrollTop.value))
    if (!enabled.value || interacting.value || exporting.value) {
      return { start: 0, end: count, top: 0, bottom: 0, scrollTop: top }
    }
    const overscan = Number.isFinite(options.overscan.value)
      ? Math.max(0, Math.floor(options.overscan.value))
      : 5
    const first = Math.floor(top / height)
    const start = Math.max(0, first - overscan)
    const end = Math.min(count, Math.ceil(top / height) + viewport + overscan)
    return { start, end, top: start * height, bottom: (count - end) * height, scrollTop: top }
  })
  const visibleRows = computed(() => flatRows.value.slice(window.value.start, window.value.end))
  return { enabled, flatRows, visibleRows, window, scrollTop, interacting, exporting }
}

export type VirtualRows = ReturnType<typeof useVirtualRows>
