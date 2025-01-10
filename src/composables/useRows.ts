import { ref, computed, type Ref, type Slots } from "vue"
import type {
  ChartRow,
  GanttBarObject,
  LabelColumnConfig,
  LabelColumnField,
  SortDirection,
  SortState
} from "../types"
import dayjs from "dayjs"

export interface UseRowsReturn {
  rows: Ref<ChartRow[]>
  sortState: Ref<SortState>
  toggleSort: (column: string) => void
  getChartRows: () => ChartRow[]
  onSortChange: (callback: () => void) => () => void
  toggleGroupExpansion: (rowId: string | number) => void
  isGroupExpanded: (rowId: string | number) => boolean
  getFlattenedRows: () => ChartRow[]
}

export interface UseRowsProps {
  barStart: Ref<string>
  barEnd: Ref<string>
  dateFormat: Ref<string | false>
  multiColumnLabel: Ref<LabelColumnConfig[]>
  onSort: (sortState: SortState) => void
  initialSort?: SortState
}

export function useRows(
  slots: Slots,
  { barStart, barEnd, dateFormat, multiColumnLabel, onSort, initialSort }: UseRowsProps,
  initialRows?: Ref<ChartRow[]>
): UseRowsReturn {
  const sortState = ref<SortState>({
    column: initialSort!.column,
    direction: initialSort!.direction
  })
  const sortChangeCallbacks = ref<Set<() => void>>(new Set())
  const expandedGroups = ref<Set<string | number>>(new Set())

  const extractRowsFromSlots = () => {
    const defaultSlot = slots.default?.()
    const rows: ChartRow[] = []

    if (!defaultSlot) return rows

    defaultSlot.forEach((child) => {
      if (child.props?.bars || child.props?.children) {
        const { label, bars = [], children = [], id } = child.props
        rows.push({
          id,
          label,
          bars,
          children,
          _originalNode: child
        })
      } else if (Array.isArray(child.children)) {
        child.children.forEach((grandchild) => {
          const grandchildNode = grandchild as { props?: ChartRow }
          if (grandchildNode?.props?.bars || grandchildNode?.props?.children) {
            const { label, bars = [], children = [], id } = grandchildNode.props
            rows.push({
              id,
              label,
              bars,
              children,
              _originalNode: grandchildNode
            })
          }
        })
      }
    })

    return rows
  }

  const calculateGroupBars = (row: ChartRow): GanttBarObject[] => {
    if (!row.children?.length) return row.bars || []

    const allChildBars = row.children.flatMap((child): GanttBarObject[] => {
      const childGroupBars = calculateGroupBars(child)
      return [...childGroupBars, ...(child.bars || [])]
    })

    if (!allChildBars.length) return []

    const minStart = allChildBars.reduce(
      (min, bar) => {
        const currentStart = toDayjs(bar[barStart.value])
        return !min || currentStart.isBefore(min) ? currentStart : min
      },
      null as dayjs.Dayjs | null
    )

    const maxEnd = allChildBars.reduce(
      (max, bar) => {
        const currentEnd = toDayjs(bar[barEnd.value])
        return !max || currentEnd.isAfter(max) ? currentEnd : max
      },
      null as dayjs.Dayjs | null
    )

    if (!minStart || !maxEnd) return []

    const format = typeof dateFormat.value === "string" ? dateFormat.value : "YYYY-MM-DD HH:mm"

    return [
      {
        [barStart.value]: minStart.format(format),
        [barEnd.value]: maxEnd.format(format),
        ganttBarConfig: {
          id: `group-${row.id || row.label}`,
          immobile: true,
          label: row.label,
          style: {
            background: "transparent",
            opacity: "0.7"
          }
        }
      }
    ]
  }

  const toDayjs = (input: string | Date) => {
    if (typeof input === "string") {
      return dayjs(input)
    } else if (input instanceof Date) {
      return dayjs(input)
    }
    return dayjs()
  }

  const getStartDate = (row: ChartRow): dayjs.Dayjs | null => {
    if (row.children?.length) {
      const childDates = row.children
        .map((child) => getStartDate(child))
        .filter((date): date is dayjs.Dayjs => date !== null)

      if (childDates.length === 0) {
        return getBarsStartDate(row.bars)
      }

      return childDates.reduce((min, date) => (!min || date.isBefore(min) ? date : min))
    }

    return getBarsStartDate(row.bars)
  }

  const getBarsStartDate = (bars: GanttBarObject[]): dayjs.Dayjs | null => {
    if (bars.length === 0) return null

    return bars.reduce((min: dayjs.Dayjs | null, bar) => {
      const currentStart = toDayjs(bar[barStart.value])
      return !min || currentStart.isBefore(min) ? currentStart : min
    }, null)
  }

  const getEndDate = (row: ChartRow): dayjs.Dayjs | null => {
    if (row.children?.length) {
      const childDates = row.children
        .map((child) => getEndDate(child))
        .filter((date): date is dayjs.Dayjs => date !== null)

      if (childDates.length === 0) {
        return getBarsEndDate(row.bars)
      }

      return childDates.reduce((max, date) => (!max || date.isAfter(max) ? date : max))
    }

    return getBarsEndDate(row.bars)
  }

  const getBarsEndDate = (bars: GanttBarObject[]): dayjs.Dayjs | null => {
    if (bars.length === 0) return null

    return bars.reduce((max: dayjs.Dayjs | null, bar) => {
      const currentEnd = toDayjs(bar[barEnd.value])
      return !max || currentEnd.isAfter(max) ? currentEnd : max
    }, null)
  }

  const calculateDuration = (row: ChartRow): number => {
    const startDate = getStartDate(row)
    const endDate = getEndDate(row)

    if (!startDate || !endDate) return 0
    return endDate.diff(startDate, "minutes")
  }

  const compareValues = (a: ChartRow, b: ChartRow, column: LabelColumnField | string): number => {
    if ((a.children?.length || 0) !== (b.children?.length || 0)) {
      return (b.children?.length || 0) - (a.children?.length || 0)
    }

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
        const aStartDate = getStartDate(a)
        const bStartDate = getStartDate(b)
        if (!aStartDate && !bStartDate) return 0
        if (!aStartDate) return 1
        if (!bStartDate) return -1
        return aStartDate.valueOf() - bStartDate.valueOf()
      }
      case "EndDate": {
        const aEndDate = getEndDate(a)
        const bEndDate = getEndDate(b)
        if (!aEndDate && !bEndDate) return 0
        if (!aEndDate) return 1
        if (!bEndDate) return -1
        return aEndDate.valueOf() - bEndDate.valueOf()
      }
      case "Duration": {
        const aDuration = calculateDuration(a)
        const bDuration = calculateDuration(b)
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

    const processRowsWithGroupBars = (rows: ChartRow[]): ChartRow[] => {
      return rows.map((row) => {
        if (row.children?.length) {
          const processedChildren = processRowsWithGroupBars(row.children)
          return {
            ...row,
            children: processedChildren,
            bars: calculateGroupBars(row)
          }
        }
        return row
      })
    }

    sourceRows = processRowsWithGroupBars(sourceRows)

    if (sortState.value.direction !== "none") {
      return sortRows(sourceRows, sortState.value.column, sortState.value.direction)
    }

    return sourceRows
  })

  const sortRows = (rows: ChartRow[], column: string, direction: SortDirection): ChartRow[] => {
    return rows
      .map((row) => {
        if (row.children?.length) {
          return {
            ...row,
            children: sortRows(row.children, column, direction)
          }
        }
        return row
      })
      .sort((a, b) => {
        const comparison = compareValues(a, b, column)
        return direction === "asc" ? comparison : -comparison
      })
  }

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

  const toggleGroupExpansion = (rowId: string | number) => {
    if (expandedGroups.value.has(rowId)) {
      expandedGroups.value.delete(rowId)
    } else {
      expandedGroups.value.add(rowId)
    }
  }

  const isGroupExpanded = (rowId: string | number): boolean => {
    return expandedGroups.value.has(rowId)
  }

  const getFlattenedRows = (): ChartRow[] => {
    const flatten = (rows: ChartRow[]): ChartRow[] => {
      return rows.flatMap((row) => {
        if (!row.children?.length || !isGroupExpanded(row.id!)) {
          return [row]
        }
        return [row, ...flatten(row.children)]
      })
    }
    return flatten(rows.value)
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
    onSortChange,
    toggleGroupExpansion,
    isGroupExpanded,
    getFlattenedRows
  }
}
