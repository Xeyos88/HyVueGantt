import type { CSSProperties } from "vue"

export interface GanttBarConnection {
  targetId: string
  connectionType?: "bezier" | "straight" | "squared"
  connectionColor?: string
}

export interface GanttBarConfig {
  id: string
  label?: string
  html?: string
  hasHandles?: boolean
  immobile?: boolean
  bundle?: string
  pushOnOverlap?: boolean
  dragLimitLeft?: number
  dragLimitRight?: number
  style?: CSSProperties
  class?: string
  connections?: GanttBarConnection[]
}

export interface GanttBarObject {
  [key: string]: any
  ganttBarConfig: GanttBarConfig
}

export interface BarPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface BarConnection {
  sourceId: string
  targetId: string
  type?: "bezier" | "straight" | "squared"
  color?: string
}
