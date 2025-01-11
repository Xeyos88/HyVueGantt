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

/**
 * Interface defining the return object from the useRows composable
 * Provides methods and reactive references for managing Gantt chart rows
 */
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

/**
 * Interface defining the required properties for the useRows composable
 */
export interface UseRowsProps {
  barStart: Ref<string>
  barEnd: Ref<string>
  dateFormat: Ref<string | false>
  multiColumnLabel: Ref<LabelColumnConfig[]>
  onSort: (sortState: SortState) => void
  initialSort?: SortState
}

/**
 * A composable that manages rows in a Gantt chart, providing sorting, grouping, and row manipulation functionality
 * @param slots - Vue slots object for accessing slot content
 * @param props - Configuration properties for the rows
 * @param initialRows - Optional initial rows data
 * @returns UseRowsReturn object containing row management methods and state
 */
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

  /**
   * Extracts rows data from slots, processing both direct and nested slot contents
   * @returns Array of ChartRow objects
   */
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

  /**
   * Calculates synthetic bars for a group based on its children's bars
   * Creates a bar that spans the entire group's timeline
   * @param row - The row to calculate group bars for
   * @returns Array of calculated group bars
   */
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

  /**
   * Converts a date string or Date object to a dayjs object
   * @param input - Date string or Date object to convert
   * @returns Dayjs object
   */
  const toDayjs = (input: string | Date) => {
    if (typeof input === "string") {
      return dayjs(input)
    } else if (input instanceof Date) {
      return dayjs(input)
    }
    return dayjs()
  }

  /**
   * Retrieves the start date of a row, considering its children's start dates
   * @param row - The row to get the start date for
   * @returns Dayjs object or null if no start date is found
   */
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

  /**
   * Retrieves the start date of a row's bars
   * @param bars - The bars to get the start date for
   * @returns Dayjs object or null if no bars are found
   */
  const getBarsStartDate = (bars: GanttBarObject[]): dayjs.Dayjs | null => {
    if (bars.length === 0) return null

    return bars.reduce((min: dayjs.Dayjs | null, bar) => {
      const currentStart = toDayjs(bar[barStart.value])
      return !min || currentStart.isBefore(min) ? currentStart : min
    }, null)
  }

  /**
   * Retrieves the end date of a row, considering its children's end dates
   * @param row - The row to get the end date for
   * @returns Dayjs object or null if no end date is found
   */
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

  /**
   * Retrieves the end date of a row's bars
   * @param bars - The bars to get the end date for
   * @returns Dayjs object or null if no bars are found
   */
  const getBarsEndDate = (bars: GanttBarObject[]): dayjs.Dayjs | null => {
    if (bars.length === 0) return null

    return bars.reduce((max: dayjs.Dayjs | null, bar) => {
      const currentEnd = toDayjs(bar[barEnd.value])
      return !max || currentEnd.isAfter(max) ? currentEnd : max
    }, null)
  }

  /**
   * Calculates the duration of a row's bars
   * For groups, calculates the total span of all child bars
   * @param row - Row to calculate duration for
   * @returns Duration in milliseconds
   */
  const calculateDuration = (row: ChartRow): number => {
    const startDate = getStartDate(row)
    const endDate = getEndDate(row)

    if (!startDate || !endDate) return 0
    return endDate.diff(startDate, "minutes")
  }

  /**
   * Compares two rows for sorting based on specified column
   * @param a - First row to compare
   * @param b - Second row to compare
   * @param column - Column to sort by
   * @returns Comparison result (-1, 0, or 1)
   */
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

  /**
   * Checks if a field is one of the standard Gantt chart fields
   * @param field - Field name to check
   * @returns Boolean indicating if field is standard
   */
  const isStandardField = (field: string): field is LabelColumnField => {
    return ["Id", "Label", "StartDate", "EndDate", "Duration"].includes(field)
  }

  /**
   * Computed property that returns the current rows with proper sorting applied
   */
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

  /**
   * Sorts rows recursively, maintaining group hierarchy
   * @param rows - Rows to sort
   * @param column - Column to sort by
   * @param direction - Sort direction
   * @returns Sorted array of rows
   */
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

  /**
   * Toggles sort state for a column
   * @param column - Column to toggle sort for
   */
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

  /**
   * Toggles expansion state of a group row
   * @param rowId - ID of the row to toggle
   */
  const toggleGroupExpansion = (rowId: string | number) => {
    if (expandedGroups.value.has(rowId)) {
      expandedGroups.value.delete(rowId)
    } else {
      expandedGroups.value.add(rowId)
    }
  }

  /**
   * Checks if a group row is expanded
   * @param rowId - ID of the row to check
   * @returns Boolean indicating expansion state
   */
  const isGroupExpanded = (rowId: string | number): boolean => {
    return expandedGroups.value.has(rowId)
  }

  /**
   * Returns a flattened array of rows, respecting group expansion state
   * @returns Flattened array of rows
   */
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

  /**
   * Registers a callback to be called when sort state changes
   * @param callback - Function to call on sort change
   * @returns Cleanup function to remove the callback
   */
  const onSortChange = (callback: () => void) => {
    sortChangeCallbacks.value.add(callback)
    return () => {
      sortChangeCallbacks.value.delete(callback)
    }
  }

  /**
   * Returns the current chart rows
   * @returns Array of current chart rows
   */
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
