import { ref, computed, type Ref, type Slots } from "vue"
import type { ChartRow, SortDirection } from "../types"

export interface UseRowsReturn {
  rows: Ref<ChartRow[]>
  sortDirection: Ref<SortDirection>
  toggleSort: () => void
  getChartRows: () => ChartRow[]
  onSortChange: (callback: () => void) => () => void
}

export function useRows(slots: Slots, initialRows?: Ref<ChartRow[]>): UseRowsReturn {
  const sortDirection = ref<SortDirection>("none")
  const sortChangeCallbacks = ref<Set<() => void>>(new Set())

  const extractRowsFromSlots = () => {
    const defaultSlot = slots.default?.()
    const rows: ChartRow[] = []

    if (!defaultSlot) return rows

    defaultSlot.forEach((child) => {
      if (child.props?.bars) {
        const { label, bars } = child.props
        rows.push({ label, bars })
      } else if (Array.isArray(child.children)) {
        child.children.forEach((grandchild) => {
          const granchildNode = grandchild as { props?: ChartRow }
          if (granchildNode?.props?.bars) {
            const { label, bars } = granchildNode.props
            rows.push({ label, bars })
          }
        })
      }
    })

    return rows
  }

  const rows = computed(() => {
    let sourceRows: ChartRow[]
    if (initialRows?.value?.length) {
      sourceRows = [...initialRows.value]
    } else {
      sourceRows = extractRowsFromSlots()
    }

    if (sortDirection.value !== "none") {
      return sourceRows.sort((a, b) => {
        const comparison = a.label.localeCompare(b.label, undefined, {
          numeric: true,
          sensitivity: "base"
        })
        return sortDirection.value === "asc" ? comparison : -comparison
      })
    }

    return sourceRows
  })

  const toggleSort = () => {
    switch (sortDirection.value) {
      case "none":
        sortDirection.value = "asc"
        break
      case "asc":
        sortDirection.value = "desc"
        break
      case "desc":
        sortDirection.value = "none"
        break
    }
    sortChangeCallbacks.value.forEach((callback) => callback())
  }

  const onSortChange = (callback: () => void) => {
    sortChangeCallbacks.value.add(callback)
    // Restituiamo una funzione di cleanup
    return () => {
      sortChangeCallbacks.value.delete(callback)
    }
  }

  const getChartRows = () => rows.value

  return {
    rows,
    sortDirection,
    toggleSort,
    getChartRows,
    onSortChange
  }
}
