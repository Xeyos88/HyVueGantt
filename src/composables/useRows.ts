import { ref, computed, type Ref, type Slots } from "vue"
import type { ChartRow, LabelColumnConfig, LabelColumnField, SortState } from "../types"
import dayjs from "dayjs"

export interface UseRowsReturn {
  rows: Ref<ChartRow[]>
  sortState: Ref<SortState>
  toggleSort: (column: string) => void
  getChartRows: () => ChartRow[]
  onSortChange: (callback: () => void) => () => void
}

export interface UseRowsProps {
  barStart: Ref<string>
  barEnd: Ref<string>
  multiColumnLabel: Ref<LabelColumnConfig[]>
  onSort: (sortState: SortState) => void
  initialSort?: SortState
}

export function useRows(
  slots: Slots,
  { barStart, barEnd, multiColumnLabel, onSort, initialSort }: UseRowsProps,
  initialRows?: Ref<ChartRow[]>
): UseRowsReturn {
  const sortState = ref<SortState>({
    column: initialSort!.column,
    direction: initialSort!.direction
  })
  const sortChangeCallbacks = ref<Set<() => void>>(new Set())

  const extractRowsFromSlots = () => {
    const defaultSlot = slots.default?.()
    const rows: ChartRow[] = []

    if (!defaultSlot) return rows

    defaultSlot.forEach((child) => {
      if (child.props?.bars) {
        const { label, bars } = child.props
        rows.push({
          label,
          bars,
          _originalNode: child
        })
      } else if (Array.isArray(child.children)) {
        child.children.forEach((grandchild) => {
          const grandchildNode = grandchild as { props?: ChartRow }
          if (grandchildNode?.props?.bars) {
            const { label, bars } = grandchildNode.props
            rows.push({
              label,
              bars,
              _originalNode: grandchildNode
            })
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

  const compareValues = (a: ChartRow, b: ChartRow, column: LabelColumnField | string): number => {
    const columnConfig = multiColumnLabel.value?.find((conf) => conf.field === column)

    if (columnConfig?.sortFn && !isStandardField(column)) {
      return columnConfig.sortFn(a, b)
    }

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
        if (columnConfig?.valueGetter) {
          const aValue = columnConfig.valueGetter(a)
          const bValue = columnConfig.valueGetter(b)
          return String(aValue).localeCompare(String(bValue))
        }
        return 0
    }
  }

  const isStandardField = (field: string): field is LabelColumnField => {
    return ["Id", "Label", "StartDate", "EndDate", "Duration"].includes(field)
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

  const toggleSort = (column: string) => {
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
    onSort(sortState.value)
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
