// src/types/bar.ts
import type { GanttCSSProperties } from "./css"
import type { ConnectionPattern, ConnectionSpeed, ConnectionType } from "./chart"
import type { ConnectionRelation } from "./chart"

// Define specific properties for connection labels
export interface ConnectionLabelStyle {
  fill?: string
  fontSize?: string
  fontWeight?: string | number
  fontFamily?: string
  opacity?: number
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
  [key: string]: any
}

export interface BaseConnection {
  targetId: string
  type?: ConnectionType
  color?: string
  pattern?: ConnectionPattern
  animated?: boolean
  animationSpeed?: ConnectionSpeed
  relation?: ConnectionRelation
  label?: string
  labelAlwaysVisible?: boolean
  labelStyle?: ConnectionLabelStyle
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
  style?: GanttCSSProperties // Use our custom type
  class?: string
  connections?: GanttBarConnection[]
  milestoneId?: string
  progress?: number
  progressResizable?: boolean
  progressStyle?: GanttCSSProperties // Use our custom type
  plannedStyle?: GanttCSSProperties // Style for planned bar
  _previousLabel?: string
}

export interface GanttBarObject {
  [key: string]: any
  ganttBarConfig: GanttBarConfig
  start_planned?: string | Date
  end_planned?: string | Date
}

type GanttBarConfigWithoutStyles = Omit<
  GanttBarConfig,
  "style" | "progressStyle" | "connections"
> & {
  connections?: Omit<GanttBarConnection, "labelStyle">[]
}

export interface GanttBarObjectWithoutStyles extends Omit<GanttBarObject, "ganttBarConfig"> {
  ganttBarConfig: GanttBarConfigWithoutStyles
}

export interface BarPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type ConnectionPoint = "start" | "end"
