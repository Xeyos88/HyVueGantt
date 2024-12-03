import type { GanttBarObject } from "./bar"

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

export interface GanttChartEmits {
  (e: "click-bar", value: GanttBarEvent): void
  (e: "mousedown-bar", value: GanttBarEvent): void
  (e: "mouseup-bar", value: GanttBarEvent): void
  (e: "dblclick-bar", value: GanttBarEvent): void
  (e: "mouseenter-bar", value: Omit<GanttBarEvent, "datetime">): void
  (e: "mouseleave-bar", value: Omit<GanttBarEvent, "datetime">): void
  (e: "dragstart-bar", value: Omit<GanttBarEvent, "datetime">): void
  (e: "drag-bar", value: Omit<GanttBarEvent, "datetime">): void
  (e: "dragend-bar", value: GanttBarDragEvent): void
  (e: "contextmenu-bar", value: GanttBarEvent): void
}
