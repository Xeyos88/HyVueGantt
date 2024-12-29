import type { CSSProperties } from "vue"
import type { ConnectionPattern, ConnectionSpeed, ConnectionType } from "./chart"

export interface BaseConnection {
  targetId: string
  type?: ConnectionType
  color?: string
  pattern?: ConnectionPattern
  animated?: boolean
  animationSpeed?: ConnectionSpeed
}

export type GanttBarConnection = BaseConnection

export interface BarConnection extends BaseConnection {
  sourceId: string
}

export interface GanttBarConfig {
  id: string
  label?: string
  html?: string
  hasHandles?: boolean
  immobile?: boolean
  bundle?: string
  pushOnOverlap?: boolean
  pushOnConnect?: boolean
  dragLimitLeft?: number
  dragLimitRight?: number
  style?: CSSProperties
  class?: string
  connections?: GanttBarConnection[]
  milestoneId?: string
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
