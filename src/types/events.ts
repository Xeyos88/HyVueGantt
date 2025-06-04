import type { ConnectionPoint, GanttBarObject } from "./bar"
import type { ChartRow, SortState } from "./chart"
import type { ExportResult } from "./export"
import type { ImportResult } from "./import"

export interface GanttBarEvent {
  bar: GanttBarObject
  e: MouseEvent
  datetime?: string | Date
}

export interface GanttBarDragEvent extends GanttBarEvent {
  movedBars?: Map<
    GanttBarObject,
    {
      oldStart: string
      oldEnd: string
    }
  >
}

export type BarMouseEvent = Omit<GanttBarEvent, "datetime">

export interface RowDragEvent {
  sourceRow: ChartRow
  targetRow?: ChartRow
  newIndex: number
  parentId?: string | number
}

export interface RowExpansion {
  rowId: string | number
}

export interface RangeSelectionEvent {
  row: ChartRow
  startDate: string | Date
  endDate: string | Date
  e: MouseEvent
}

export interface SortEvent {
  sortState: SortState
}

export interface ConnectionStartEvent {
  sourceBar: GanttBarObject
  connectionPoint: ConnectionPoint
  e: MouseEvent
}

export interface ConnectionDragEvent {
  sourceBar: GanttBarObject
  connectionPoint: ConnectionPoint
  currentX: number
  currentY: number
  e: MouseEvent
}

export interface ConnectionCompleteEvent {
  sourceBar: GanttBarObject
  targetBar: GanttBarObject
  sourcePoint: ConnectionPoint
  targetPoint: ConnectionPoint
  e: MouseEvent
}

export interface ConnectionDeleteEvent {
  sourceBar: GanttBarObject
  targetBar: GanttBarObject
  e: MouseEvent
}

export interface LabelEditEvent {
  bar: GanttBarObject
  oldValue: string
  newValue: string
  e: MouseEvent
}

export interface GGanttChartEmits {
  (e: "click-bar", value: GanttBarEvent): void
  (e: "mousedown-bar", value: GanttBarEvent): void
  (e: "mouseup-bar", value: GanttBarEvent): void
  (e: "dblclick-bar", value: GanttBarEvent): void
  (e: "mouseenter-bar", value: BarMouseEvent): void
  (e: "mouseleave-bar", value: BarMouseEvent): void
  (e: "dragstart-bar", value: BarMouseEvent): void
  (e: "drag-bar", value: BarMouseEvent): void
  (e: "dragend-bar", value: GanttBarDragEvent): void
  (e: "contextmenu-bar", value: GanttBarEvent): void
  (e: "sort", value: SortEvent): void
  (e: "group-expansion", value: { rowId: string | number }): void
  (e: "row-drop", value: RowDragEvent): void
  (e: "progress-change", value: BarMouseEvent): void
  (e: "progress-drag-start", value: BarMouseEvent): void
  (e: "progress-drag-end", value: BarMouseEvent): void
  (e: "connection-start", value: ConnectionStartEvent): void
  (e: "connection-drag", value: ConnectionDragEvent): void
  (e: "connection-complete", value: ConnectionCompleteEvent): void
  (e: "connection-cancel", value: ConnectionStartEvent): void
  (e: "connection-delete", value: ConnectionDeleteEvent): void
  (e: "label-edit", value: LabelEditEvent): void
  (e: "export-start", format: string): void
  (e: "export-success", result: ExportResult): void
  (e: "export-error", error: string): void
  (e: "import-data", value: ImportResult): void
  (e: "range-selection", value: RangeSelectionEvent): void
}
