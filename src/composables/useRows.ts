import { ref, computed, type Ref, type Slots, watch, onMounted, type ComputedRef } from "vue"
import type {
  ChartRow,
  GanttBarObject,
  LabelColumnConfig,
  LabelColumnField,
  SortDirection,
  SortState,
  HistoryState,
  BaseConnection
} from "../types"
import dayjs from "dayjs"
import { cloneDeep } from "lodash-es"

/**
 * Interface defining the return object from the useRows composable
 * Provides methods and reactive references for managing Gantt chart rows
 */
export interface UseRowsReturn {
  rows: Ref<ChartRow[]>
  updateRows: (newRows: ChartRow[]) => void
  sortState: Ref<SortState>
  toggleSort: (column: string) => void
  getChartRows: () => ChartRow[]
  onSortChange: (callback: () => void) => () => void
  toggleGroupExpansion: (rowId: string | number) => void
  isGroupExpanded: (rowId: string | number) => boolean
  getFlattenedRows: () => ChartRow[]
  onGroupExpansionChange: (callback: () => void) => () => void
  customOrder: Ref<Map<string | number, number>>
  resetCustomOrder: () => void
  expandAllGroups: () => void
  collapseAllGroups: () => void
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  undo: () => HistoryChange
  redo: () => HistoryChange
  clearHistory: () => void
  onBarMove: () => void
  areAllGroupsExpanded: ComputedRef<boolean>
  areAllGroupsCollapsed: ComputedRef<boolean>
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
  onGroupExpansion: (rowId: string | number) => void
}

interface CleanRow {
  id: string | number
  label: string
  bars: GanttBarObject[]
  connections?: BaseConnection[]
  children?: CleanRow[]
}

interface BarHistoryChange {
  barId: string
  rowId: string | number
  oldStart?: string
  newStart?: string
  oldEnd?: string
  newEnd?: string
}

interface RowHistoryChange {
  type: "reorder" | "group"
  sourceRow: ChartRow
  targetRow?: ChartRow
  oldIndex: number
  newIndex: number
  oldParentId?: string | number
  newParentId?: string | number
}

interface HistoryChange {
  rowChanges: RowHistoryChange[]
  barChanges: BarHistoryChange[]
}

/**
 * Creates a snapshot of the current chart state for history tracking
 * Captures rows, expanded groups, and custom ordering
 * @param rows - Current rows in the chart
 * @param expandedGroups - Set of currently expanded group IDs
 * @param customOrder - Map of current row ordering
 * @returns HistoryState object containing current chart state
 */
function createHistoryState(
  rows: ChartRow[],
  expandedGroups: Set<string | number>,
  customOrder: Map<string | number, number>
): HistoryState {
  /**
   * Helper function that creates a deep copy of a row's state for history tracking
   * Cleans and normalizes row data for storage
   * @param row - Row to prepare for cloning
   * @returns Cleaned row object ready for history
   */
  const prepareRowForCloning = (row: ChartRow): CleanRow => {
    const cleanRow: CleanRow = {
      id: row.id,
      label: row.label,
      bars:
        row.bars?.map((bar) => ({
          ...bar,
          ganttBarConfig: {
            id: bar.ganttBarConfig.id,
            label: bar.ganttBarConfig.label,
            html: bar.ganttBarConfig.html,
            hasHandles: bar.ganttBarConfig.hasHandles,
            immobile: bar.ganttBarConfig.immobile,
            bundle: bar.ganttBarConfig.bundle,
            pushOnOverlap: bar.ganttBarConfig.pushOnOverlap,
            pushOnConnect: bar.ganttBarConfig.pushOnConnect,
            style: bar.ganttBarConfig.style,
            class: bar.ganttBarConfig.class,
            connections: bar.ganttBarConfig.connections,
            milestoneId: bar.ganttBarConfig.milestoneId,
            progress: bar.ganttBarConfig.progress,
            progressStyle: bar.ganttBarConfig.progressStyle,
            progressResizable: bar.ganttBarConfig.progressResizable
          }
        })) || [],
      connections: row.connections,
      children: row.children?.map(prepareRowForCloning)
    }

    return cleanRow
  }

  const preparedRows = rows.map(prepareRowForCloning)

  return {
    rows: cloneDeep(preparedRows),
    expandedGroups: new Set(expandedGroups),
    customOrder: new Map(customOrder),
    timestamp: Date.now()
  }
}

/**
 * Restores a previous state from history
 * Reconstructs rows with their original nodes and maintains component references
 * @param state - Historical state to restore
 * @param originalRows - Current rows to merge with historical data
 * @returns Object containing restored rows, groups and ordering
 */
function restoreState(
  state: HistoryState,
  originalRows: ChartRow[]
): {
  rows: ChartRow[]
  expandedGroups: Set<string | number>
  customOrder: Map<string | number, number>
} {
  /**
   * Restores a single row from history state
   * Preserves original component references while updating data
   * @param historyRow - Row data from history
   * @param originalRow - Current row instance to merge with
   * @returns Restored row with preserved component references
   */
  const restoreRow = (historyRow: CleanRow, originalRow: ChartRow | undefined): ChartRow => {
    const restored = cloneDeep(historyRow) as ChartRow

    if (originalRow) {
      restored._originalNode = originalRow._originalNode
    }

    if (restored.children && originalRow?.children) {
      restored.children = restored.children.map((child, index) =>
        restoreRow(child, originalRow.children![index])
      )
    }

    return restored
  }

  return {
    rows: state.rows.map((historyRow) => {
      const originalRow = originalRows.find((r) => r.id === historyRow.id)
      return restoreRow(historyRow as CleanRow, originalRow)
    }),
    expandedGroups: new Set(state.expandedGroups),
    customOrder: new Map(state.customOrder)
  }
}

/**
 * Finds the parent ID for a row at a given path
 * Used for tracking hierarchy changes in row movement
 * @param rows - Array of rows to search
 * @param path - Array of indices representing path to row
 * @returns ID of parent row or undefined if at root
 */
function findParentId(rows: ChartRow[], path: number[]): string | number | undefined {
  if (path.length <= 1) return undefined
  let current = rows[path[0]!]
  for (let i = 1; i < path.length - 1; i++) {
    if (!current?.children) return undefined
    current = current.children[path[i]!]
  }
  return current?.id
}

/**
 * Recursively searches for a bar by ID through all rows
 * @param rows - Array of rows to search
 * @param barId - ID of bar to find
 * @returns Found bar object or null if not found
 */
export function findBarInRows(rows: ChartRow[], barId: string): GanttBarObject | null {
  for (const row of rows) {
    const found = row.bars.find((bar) => bar.ganttBarConfig.id === barId)
    if (found) return found

    if (row.children) {
      const foundInChildren = findBarInRows(row.children, barId)
      if (foundInChildren) return foundInChildren
    }
  }
  return null
}

/**
 * Recursively searches for a row by ID
 * @param rows - Array of rows to search
 * @param id - ID of row to find
 * @returns Found row or null if not found
 */
function findRowById(rows: ChartRow[], id: string | number): ChartRow | null {
  for (const row of rows) {
    if (row.id === id) return row
    if (row.children) {
      const found = findRowById(row.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Finds the path of indices to a row with given ID
 * @param rows - Array of rows to search
 * @param id - ID of row to find path for
 * @returns Array of indices representing path to row
 */
function findRowPath(rows: ChartRow[], id: string | number): number[] {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]!.id === id) return [i]
    if (rows[i]!.children) {
      const childPath = findRowPath(rows[i]!.children!, id)
      if (childPath.length) return [i, ...childPath]
    }
  }
  return []
}

/**
 * Finds the row ID that contains a specific bar
 * @param barId - ID of bar to locate
 * @param rows - Array of rows to search
 * @returns ID of row containing the bar or empty string if not found
 */
function findRowIdForBar(barId: string, rows: ChartRow[]): string | number {
  function searchInRows(rows: ChartRow[]): string | number | null {
    for (const row of rows) {
      if (row.bars.some((bar) => bar.ganttBarConfig.id === barId)) {
        return row.id!
      }
      if (row.children) {
        const foundId = searchInRows(row.children)
        if (foundId) return foundId
      }
    }
    return null
  }
  return searchInRows(rows) || ""
}

/**
 * Extracts all bars from a historical state
 * Creates a map for efficient bar lookup
 * @param state - Historical state to extract bars from
 * @returns Map of bar IDs to bar objects
 */
function getAllBarsFromState(state: HistoryState): Map<string, GanttBarObject> {
  const barsMap = new Map()

  function collectBars(rows: ChartRow[]) {
    rows.forEach((row) => {
      row.bars.forEach((bar) => {
        barsMap.set(bar.ganttBarConfig.id, bar)
      })
      if (row.children) {
        collectBars(row.children)
      }
    })
  }

  collectBars(state.rows)
  return barsMap
}

/**
 * Compares two versions of a bar to detect changes
 * @param oldBar - Previous version of bar
 * @param newBar - Current version of bar
 * @param barStart - Reference to start time property
 * @param barEnd - Reference to end time property
 * @param rows - Reference to current rows
 * @returns Change object or null if no changes
 */
function compareBarStates(
  oldBar: GanttBarObject,
  newBar: GanttBarObject,
  barStart: Ref<string>,
  barEnd: Ref<string>,
  rows: Ref<ChartRow[]>
): BarHistoryChange | null {
  if (
    oldBar[barStart.value] === newBar[barStart.value] &&
    oldBar[barEnd.value] === newBar[barEnd.value]
  ) {
    return null
  }

  return {
    barId: oldBar.ganttBarConfig.id,
    rowId: findRowIdForBar(oldBar.ganttBarConfig.id, rows.value),
    oldStart: oldBar[barStart.value],
    newStart: newBar[barStart.value],
    oldEnd: oldBar[barEnd.value],
    newEnd: newBar[barEnd.value]
  }
}

/**
 * Compares all bars between two states to detect changes
 * @param oldState - Previous chart state
 * @param newState - Current chart state
 * @param barStart - Reference to start time property
 * @param barEnd - Reference to end time property
 * @param rows - Reference to current rows
 * @returns Array of detected bar changes
 */
function compareAllBars(
  oldState: HistoryState,
  newState: HistoryState,
  barStart: Ref<string>,
  barEnd: Ref<string>,
  rows: Ref<ChartRow[]>
): BarHistoryChange[] {
  const changes: BarHistoryChange[] = []

  const oldBars = getAllBarsFromState(oldState)
  const newBars = getAllBarsFromState(newState)

  oldBars.forEach((oldBar, barId) => {
    const newBar = newBars.get(barId)
    if (newBar) {
      const change = compareBarStates(oldBar, newBar, barStart, barEnd, rows)
      if (change) {
        changes.push(change)
      }
    }
  })

  return changes
}

/**
 * Calculates all changes between two chart states
 * Includes both row position changes and bar modifications
 * @param prevState - Previous chart state
 * @param newState - Current chart state
 * @param barStart - Reference to start time property
 * @param barEnd - Reference to end time property
 * @param rows - Reference to current rows
 * @returns Object containing all detected changes
 */
function calculateHistoryChanges(
  prevState: HistoryState,
  newState: HistoryState,
  barStart: Ref<string>,
  barEnd: Ref<string>,
  rows: Ref<ChartRow[]>
): HistoryChange {
  const rowChanges: RowHistoryChange[] = []

  /**
   * Compares row positions between states to detect structural changes
   * Used as part of history change calculation
   * @param oldRows - Previous row arrangement
   * @returns Array of detected row position changes
   */
  function compareRows(oldRows: ChartRow[]) {
    for (const oldRow of oldRows) {
      if (!oldRow.id) continue

      const oldPath = findRowPath(prevState.rows, oldRow.id)
      const newPath = findRowPath(newState.rows, oldRow.id)

      if (oldPath.length !== newPath.length || !oldPath.every((v, i) => v === newPath[i])) {
        const oldParentId = oldPath.length > 1 ? findParentId(prevState.rows, oldPath) : undefined
        const newParentId = newPath.length > 1 ? findParentId(newState.rows, newPath) : undefined

        rowChanges.push({
          type: oldParentId !== newParentId ? "group" : "reorder",
          sourceRow: oldRow,
          oldIndex: oldPath[oldPath.length - 1] as number,
          newIndex: newPath[newPath.length - 1] as number,
          oldParentId,
          newParentId
        })
      }

      if (oldRow.children) {
        const newRow = findRowById(newState.rows, oldRow.id)
        if (newRow?.children) {
          compareRows(oldRow.children)
        }
      }
    }
  }

  compareRows(prevState.rows)
  const barChanges = compareAllBars(prevState, newState, barStart, barEnd, rows)

  return {
    rowChanges,
    barChanges
  }
}

const MAX_HISTORY_STATES = 50

/**
 * A composable that manages rows in a Gantt chart, providing sorting, grouping, and row manipulation functionality
 * @param slots - Vue slots object for accessing slot content
 * @param props - Configuration properties for the rows
 * @param initialRows - Optional initial rows data
 * @returns UseRowsReturn object containing row management methods and state
 */
export function useRows(
  slots: Slots,
  {
    barStart,
    barEnd,
    dateFormat,
    multiColumnLabel,
    onSort,
    initialSort,
    onGroupExpansion
  }: UseRowsProps,
  initialRows?: Ref<ChartRow[]>
): UseRowsReturn {
  const sortState = ref<SortState>({
    column: initialSort!.column,
    direction: initialSort!.direction
  })
  const sortChangeCallbacks = ref<Set<() => void>>(new Set())
  const expandedGroups = ref<Set<string | number>>(new Set())
  const groupExpansionCallbacks = ref<Set<() => void>>(new Set())
  const customOrder = ref<Map<string | number, number>>(new Map())
  const reorderedRows = ref<ChartRow[]>([])

  const historyStates = ref<HistoryState[]>([])
  const currentHistoryIndex = ref(-1)

  /**
   * Initializes history tracking for the chart
   * Creates first history entry with current state
   */
  const initializeHistory = () => {
    historyStates.value = [
      createHistoryState(reorderedRows.value, expandedGroups.value, customOrder.value)
    ]
    currentHistoryIndex.value = 0
  }

  onMounted(() => {
    initializeHistory()
  })

  const canUndo = computed(() => currentHistoryIndex.value > 0 && historyStates.value.length > 1)
  const canRedo = computed(
    () =>
      historyStates.value.length > 1 && currentHistoryIndex.value < historyStates.value.length - 1
  )

  /**
   * Adds a new state to the history stack
   * Handles history size limits and current position
   */
  const addHistoryState = () => {
    if (currentHistoryIndex.value < historyStates.value.length - 1) {
      historyStates.value = historyStates.value.slice(0, currentHistoryIndex.value + 1)
    }

    historyStates.value.push(
      createHistoryState(reorderedRows.value, expandedGroups.value, customOrder.value)
    )

    currentHistoryIndex.value++

    if (historyStates.value.length > MAX_HISTORY_STATES) {
      const excess = historyStates.value.length - MAX_HISTORY_STATES
      historyStates.value = historyStates.value.slice(excess)
      currentHistoryIndex.value = Math.max(0, currentHistoryIndex.value - excess)
    }
  }

  /**
   * Reverts chart to previous state
   * Handles both row and bar changes
   * @returns Object containing reverted changes
   */
  const undo = () => {
    const currentState = historyStates.value[currentHistoryIndex.value]!
    currentHistoryIndex.value--
    const previousState = historyStates.value[currentHistoryIndex.value]!

    const changes = calculateHistoryChanges(currentState, previousState, barStart, barEnd, rows)

    const restored = restoreState(previousState, reorderedRows.value)
    reorderedRows.value = restored.rows
    customOrder.value = restored.customOrder

    return changes
  }

  /**
   * Reapplies previously undone changes
   * Handles both row and bar changes
   * @returns Object containing reapplied changes
   */
  const redo = () => {
    const currentState = historyStates.value[currentHistoryIndex.value]!
    currentHistoryIndex.value++
    const nextState = historyStates.value[currentHistoryIndex.value]!

    const changes = calculateHistoryChanges(currentState, nextState, barStart, barEnd, rows)

    const restored = restoreState(nextState, reorderedRows.value)
    reorderedRows.value = restored.rows
    customOrder.value = restored.customOrder

    return changes
  }

  /**
   * Records bar movement in history
   * Called after bar position changes are completed
   */
  const onBarMove = () => {
    addHistoryState()
  }

  /**
   * Resets history tracking
   * Clears all recorded states except current
   */
  const clearHistory = () => {
    initializeHistory()
  }
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
        const { label, bars = [], children = [], id, connections = [] } = child.props
        rows.push({
          id,
          label,
          bars,
          children,
          connections,
          _originalNode: child
        })
      } else if (Array.isArray(child.children)) {
        child.children.forEach((grandchild) => {
          const grandchildNode = grandchild as { props?: ChartRow }
          if (grandchildNode?.props?.bars || grandchildNode?.props?.children) {
            const { label, bars = [], children = [], id, connections = [] } = grandchildNode.props
            rows.push({
              id,
              label,
              bars,
              children,
              connections,
              _originalNode: grandchildNode
            })
          }
        })
      }
    })

    return rows
  }

  /**
   * Retrieves source rows from props or slots
   * Handles both dynamic and static row sources
   * @returns Array of source rows
   */
  const getSourceRows = () => {
    if (initialRows?.value?.length) {
      return initialRows.value
    }
    return extractRowsFromSlots()
  }

  reorderedRows.value = getSourceRows()

  watch(
    () => getSourceRows(),
    (newRows) => {
      reorderedRows.value = newRows
    }
  )

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
            background: "transparent"
          },
          connections: row.connections || []
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
      case "Progress": {
        const getAvgProgress = (row: ChartRow) => {
          const progressValues = row.bars
            .map((bar) => bar.ganttBarConfig.progress)
            .filter((progress): progress is number => progress !== undefined)

          if (progressValues.length === 0) return -1
          return progressValues.reduce((sum, curr) => sum + curr, 0) / progressValues.length
        }

        const progressA = getAvgProgress(a)
        const progressB = getAvgProgress(b)

        if (progressA === -1 && progressB === -1) return 0
        if (progressA === -1) return 1
        if (progressB === -1) return -1

        return progressA - progressB
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
   * Applies custom row ordering when sorting is disabled
   * @param rowsToSort - Rows to apply custom order to
   * @returns Reordered array of rows
   */
  const applyCustomOrder = (rowsToSort: ChartRow[]): ChartRow[] => {
    if (customOrder.value.size === 0 || sortState.value.direction !== "none") {
      return rowsToSort
    }

    return [...rowsToSort].sort((a, b) => {
      const orderA = a.id ? (customOrder.value.get(a.id) ?? Number.MAX_VALUE) : Number.MAX_VALUE
      const orderB = b.id ? (customOrder.value.get(b.id) ?? Number.MAX_VALUE) : Number.MAX_VALUE
      return orderA - orderB
    })
  }

  /**
   * Computed property that returns the current rows with proper sorting applied
   */
  const rows = computed(() => {
    let sourceRows = [...reorderedRows.value]

    if (!sourceRows.length) return sourceRows

    /**
     * Processes rows to include group bars
     * Calculates synthetic bars for group rows based on children
     * @param rows - Rows to process
     * @returns Processed rows with group bars
     */
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

    if (customOrder.value.size > 0) {
      return sourceRows.sort((a, b) => {
        const orderA = a.id ? (customOrder.value.get(a.id) ?? Number.MAX_VALUE) : Number.MAX_VALUE
        const orderB = b.id ? (customOrder.value.get(b.id) ?? Number.MAX_VALUE) : Number.MAX_VALUE
        return orderA - orderB
      })
    }

    return sourceRows
  })

  /**
   * Resets custom row ordering
   * Clears stored order information
   */
  const resetCustomOrder = () => {
    customOrder.value.clear()
  }

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
    const previousDirection = sortState.value.direction

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
    if (previousDirection !== "none" && sortState.value.direction === "none") {
      applyCustomOrder(rows.value)
    }
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

    onGroupExpansion(rowId)
    groupExpansionCallbacks.value.forEach((callback) => callback())
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
   * Registers a callback to be called when group expansion state changes
   * @param callback - Function to call on group expansion change
   * @returns Cleanup function to remove the callback
   */
  const onGroupExpansionChange = (callback: () => void) => {
    groupExpansionCallbacks.value.add(callback)
    return () => {
      groupExpansionCallbacks.value.delete(callback)
    }
  }

  /**
   * Expand all row group
   */
  const expandAllGroups = () => {
    const addGroupsToExpanded = (rows: ChartRow[]) => {
      rows.forEach((row) => {
        if (row.children?.length && row.id) {
          expandedGroups.value.add(row.id)
          addGroupsToExpanded(row.children)
        }
      })
    }

    addGroupsToExpanded(getSourceRows())
    groupExpansionCallbacks.value.forEach((callback) => callback())
  }

  /**
   * Collapse all row roup
   */
  const collapseAllGroups = () => {
    expandedGroups.value.clear()
    groupExpansionCallbacks.value.forEach((callback) => callback())
  }

  /**
   * A computed property that checks if there are any group rows in the chart
   * Used as a utility to enable/disable group-related functionality
   *
   * @returns Boolean indicating if there are any groups
   */
  const hasAnyGroup = computed(() => {
    const checkForGroups = (rows: ChartRow[]): boolean => {
      return rows.some(
        (row) => row.children?.length! > 0 || (row.children && checkForGroups(row.children))
      )
    }
    return checkForGroups(rows.value)
  })

  /**
   * A computed property that checks if all group rows are in expanded state
   * Performs a recursive check through the row hierarchy
   * Used to control the state of expand all functionality
   *
   * @returns Boolean indicating if all groups are expanded
   */
  const areAllGroupsExpanded = computed(() => {
    if (!hasAnyGroup.value) return false

    const checkAllExpanded = (rows: ChartRow[]): boolean => {
      return rows.every((row) => {
        if (row.children?.length) {
          const isCurrentExpanded = row.id ? expandedGroups.value.has(row.id) : false
          return isCurrentExpanded && checkAllExpanded(row.children)
        }
        return true
      })
    }

    return checkAllExpanded(rows.value)
  })

  /**
   * A computed property that checks if all group rows are in collapsed state
   * Performs a recursive check through the row hierarchy
   * Used to control the state of collapse all functionality
   *
   * @returns Boolean indicating if all groups are collapsed
   */
  const areAllGroupsCollapsed = computed(() => {
    if (!hasAnyGroup.value) return false

    const checkAllCollapsed = (rows: ChartRow[]): boolean => {
      return rows.every((row) => {
        if (row.children?.length) {
          const isCurrentCollapsed = row.id ? !expandedGroups.value.has(row.id) : true
          return isCurrentCollapsed && checkAllCollapsed(row.children)
        }
        return true
      })
    }

    return checkAllCollapsed(rows.value)
  })

  /**
   * Returns the current chart rows
   * @returns Array of current chart rows
   */
  const getChartRows = () => rows.value

  /**
   * Updates rows and records change in history
   * @param newRows - New rows to update with
   */
  const updateRows = (newRows: ChartRow[]) => {
    reorderedRows.value = newRows
    addHistoryState()
  }

  return {
    rows,
    updateRows,
    sortState,
    toggleSort,
    getChartRows,
    onSortChange,
    toggleGroupExpansion,
    isGroupExpanded,
    getFlattenedRows,
    onGroupExpansionChange,
    customOrder,
    resetCustomOrder,
    expandAllGroups,
    collapseAllGroups,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHistory,
    onBarMove,
    areAllGroupsExpanded,
    areAllGroupsCollapsed
  }
}
