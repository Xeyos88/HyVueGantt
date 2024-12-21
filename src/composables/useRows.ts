import { ref, computed, type Ref, type Slots } from "vue"
import type { ChartRow, LabelColumnField, SortState } from "../types"
import dayjs from "dayjs"

export interface UseRowsReturn {
  rows: Ref<ChartRow[]>
  sortState: Ref<SortState>
  toggleSort: (column: LabelColumnField) => void
  getChartRows: () => ChartRow[]
  onSortChange: (callback: () => void) => () => void
}

export interface UseRowsProps {
  barStart: Ref<string>
  barEnd: Ref<string>
}

export function useRows(
  slots: Slots,
  { barStart, barEnd }: UseRowsProps,
  initialRows?: Ref<ChartRow[]>,
  initialSortColumn: LabelColumnField = "Label"
): UseRowsReturn {
  const sortState = ref<SortState>({
    column: initialSortColumn,
    direction: "none"
  })
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

  const toDayjs = (input: string | Date) => {
    if (typeof input === "string") {
      return dayjs(input)
    } else if (input instanceof Date) {
      return dayjs(input)
    }
    return dayjs()
  }

  const compareValues = (a: ChartRow, b: ChartRow, column: LabelColumnField): number => {
    switch (column) {
      case "Id":
        const aId = a.id ?? 0
        const bId = b.id ?? 0
        return aId < bId ? -1 : aId > bId ? 1 : 0
      case "Label":
        return a.label.localeCompare(b.label, undefined, {
          numeric: true,
          sensitivity: "base"
        })
      case "StartDate": {
        if (!a.bars.length || !b.bars.length) return 0
        const aStartDate = toDayjs(a.bars[0]![barStart.value]).valueOf()
        const bStartDate = toDayjs(b.bars[0]![barStart.value]).valueOf()
        return aStartDate - bStartDate
      }
      case "EndDate": {
        if (!a.bars.length || !b.bars.length) return 0
        const aEndDate = toDayjs(a.bars[0]![barEnd.value]).valueOf()
        const bEndDate = toDayjs(b.bars[0]![barEnd.value]).valueOf()
        return aEndDate - bEndDate
      }
      case "Duration": {
        if (!a.bars.length || !b.bars.length) return 0
        const aDuration = toDayjs(a.bars[0]![barEnd.value]).diff(
          toDayjs(a.bars[0]![barStart.value])
        )
        const bDuration = toDayjs(b.bars[0]![barEnd.value]).diff(
          toDayjs(b.bars[0]![barStart.value])
        )
        return aDuration - bDuration
      }
      default:
        return 0
    }
  }

  const rows = computed(() => {
    let sourceRows: ChartRow[]
    if (initialRows?.value?.length) {
      sourceRows = [...initialRows.value]
    } else {
      sourceRows = extractRowsFromSlots()
    }

    if (sortState.value.direction !== "none") {
      return sourceRows.sort((a, b) => {
        const comparison = compareValues(a, b, sortState.value.column)
        return sortState.value.direction === "asc" ? comparison : -comparison
      })
    }

    return sourceRows
  })

  const toggleSort = (column: LabelColumnField) => {
    if (sortState.value.column !== column) {
      sortState.value = {
        column,
        direction: "asc"
      }
    } else {
      switch (sortState.value.direction) {
        case "none":
          sortState.value.direction = "asc"
          break
        case "asc":
          sortState.value.direction = "desc"
          break
        case "desc":
          sortState.value.direction = "none"
          break
      }
    }
    sortChangeCallbacks.value.forEach((callback) => callback())
  }

  const onSortChange = (callback: () => void) => {
    sortChangeCallbacks.value.add(callback)
    return () => {
      sortChangeCallbacks.value.delete(callback)
    }
  }

  const getChartRows = () => rows.value

  return {
    rows,
    sortState,
    toggleSort,
    getChartRows,
    onSortChange
  }
}
