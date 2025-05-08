import type { ComputedRef, Ref } from "vue"
import type { GanttBarObject } from "./bar"
import type { ChartRow, GanttMilestone } from "./chart"

/**
 * Interface that defines the props for the commands slot
 */
interface CommandsSlotProps {
  /** Function to increase zoom level */
  zoomIn: () => void

  /** Function to decrease zoom level */
  zoomOut: () => void

  /** Function to scroll one row up */
  scrollRowUp: () => void

  /** Function to scroll one row down */
  scrollRowDown: () => void

  /** Function to expand all groups */
  expandAllGroups: () => void

  /** Function to collapse all groups */
  collapseAllGroups: () => void

  /** Function to scroll to start */
  handleToStart: () => void

  /** Function to scroll backward */
  handleBack: () => void

  /** Function to handle scroll */
  handleScroll: () => void

  /** Function to scroll forward */
  handleForward: () => void

  /** Function to scroll to end */
  handleToEnd: () => void

  /** Function to undo last action */
  undo: () => void

  /** Function to redo last undone action */
  redo: () => void

  /** Flag indicating if undo is available */
  canUndo: ComputedRef<boolean>

  /** Flag indicating if redo is available */
  canRedo: ComputedRef<boolean>

  /** Flag indicating if scroll is at top */
  isAtTop: Ref<boolean>

  /** Flag indicating if scroll is at bottom */
  isAtBottom: Ref<boolean>

  /** Current zoom level */
  zoomLevel: Ref<number>
}

/**
 * Type that defines the specific label column types based on their field names
 */
interface LabelColumnSlotProps {
  Label: {
    value: string
    row: ChartRow
  }
  Id: {
    value: string | number
    row: ChartRow
  }
  StartDate: {
    value: string
    row: ChartRow
  }
  EndDate: {
    value: string
    row: ChartRow
  }
  Duration: {
    value: string
    row: ChartRow
  }
  [key: string]: {
    value: string | number
    row: ChartRow
  }
}

/**
 * Interface that defines all available slots in the GGanttChart component
 */
export interface GGanttChartSlots {
  /**
   * Slot to customize the label column title
   */
  "label-column-title": () => void

  /**
   * Slot to customize the row in the label column
   * @param props Row properties
   */
  "label-column-row": (props: { row: ChartRow; value: string | number }) => void

  /**
   * Slot to customize the upper time unit in the time axis
   * @param props Time unit properties
   */
  "upper-timeunit": (props: { label: string; value: string; date: Date }) => void

  /**
   * Slot to customize the time unit in the time axis
   * @param props Time unit properties
   */
  timeunit: (props: { label: string; value: string; date: Date }) => void

  /**
   * Slot to customize the current time label
   */
  "current-time-label": () => void

  /**
   * Slot to customize milestone display
   * @param props Milestone properties
   */
  milestone: (props: {
    milestone: GanttMilestone
    styleConfig: {
      label: {
        background: string
        color: string
        border: string
      }
      marker: {
        borderLeft: string
      }
    }
    position: number
  }) => void

  /**
   * Dynamic slot to customize a specific milestone
   * @param props Same properties as milestone slot
   */
  [key: `milestone-${string}`]: (props: {
    milestone: GanttMilestone
    styleConfig: {
      label: {
        background: string
        color: string
        border: string
      }
      marker: {
        borderLeft: string
      }
    }
    position: number
  }) => void

  /**
   * Slot to customize Gantt commands
   * @param props Control properties and functions
   */
  commands: (props: CommandsSlotProps) => void

  /**
   * Slot to customize bar tooltip
   * @param props Tooltip properties
   */
  "bar-tooltip": (props: {
    bar: GanttBarObject
    barStart: string | Date
    barEnd: string | Date
  }) => void

  /**
   * Slot to customize bar label
   * @param props Bar properties
   */
  "bar-label": (props: { bar: GanttBarObject }) => void

  /**
   * Slot to customize a specific column in the label
   * @param props Column properties
   */
  [key: `label-column-${keyof LabelColumnSlotProps}`]: (
    props: LabelColumnSlotProps[keyof LabelColumnSlotProps]
  ) => void

  /**
   * Slot to customize a specific column in the label for group rows
   * @param props Column properties
   */
  [key: `label-column-${keyof LabelColumnSlotProps}-group`]: (
    props: LabelColumnSlotProps[keyof LabelColumnSlotProps]
  ) => void
}
