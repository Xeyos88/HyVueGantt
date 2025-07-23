// src/types/style.ts
import type { GanttColor } from "./css"

export interface ColorScheme {
  primary: GanttColor
  secondary: GanttColor
  ternary: GanttColor
  quartenary: GanttColor
  hoverHighlight: GanttColor
  markerCurrentTime: GanttColor
  markerPointer: GanttColor
  text: GanttColor
  background: GanttColor
  toast?: GanttColor
  commands?: GanttColor
  rangeHighlight?: GanttColor
  holidayHighlight?: GanttColor
  barContainer?: GanttColor
  rowContainer?: GanttColor
  gridAndBorder?: GanttColor
}
