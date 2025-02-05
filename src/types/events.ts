import type { GanttBarObject } from "./bar"
import type { ChartRow, SortState } from "./chart"

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
  (e: "row-drop", value: RowDragEvent): void
  (e: "group-expansion", value: RowExpansion): void
  (e: "sort", value: SortState): void
  (e: "progress-change", value: BarMouseEvent): void
  (e: "progress-drag-start", value: BarMouseEvent): void
  (e: "progress-drag-end", value: BarMouseEvent): void
}
