import type { ConnectionPoint, GanttBarObject } from "./bar"

export interface ConnectionCreationState {
  isCreating: boolean
  sourceBar: GanttBarObject | null
  sourcePoint: ConnectionPoint | null
  mouseX: number
  mouseY: number
}

export interface ConnectionValidation {
  isValid: boolean
  message?: string
}

export interface ConnectionPointStyle {
  size: number
  color: string
  hoverColor: string
  invalidColor: string
}

export interface ConnectionPointHoverState {
  isVisible: boolean
  barId: string | null
  point: ConnectionPoint | null
}

export interface ConnectionPreviewStyle {
  strokeWidth: number
  strokeDasharray?: string
  strokeOpacity: number
}

export interface SelectedConnection {
  sourceId: string
  targetId: string
}
