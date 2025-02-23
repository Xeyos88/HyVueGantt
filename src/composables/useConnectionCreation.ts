// composables/useConnectionCreation.ts

import { ref, computed, type ComputedRef, type Ref } from "vue"
import type {
  GGanttChartConfig,
  GanttBarObject,
  ConnectionStartEvent,
  ConnectionDragEvent,
  ConnectionCompleteEvent,
  ConnectionCreationState,
  ConnectionValidation,
  ConnectionPointHoverState,
  ConnectionPoint
} from "../types"
import type { UseRowsReturn } from "../composables/useRows"

export interface UseConnectionCreationReturn {
  connectionState: Ref<ConnectionCreationState>
  hoverState: Ref<ConnectionPointHoverState>
  startConnectionCreation: (bar: GanttBarObject, point: ConnectionPoint, e: MouseEvent) => void

  updateConnectionDrag: (e: MouseEvent) => void
  completeConnection: (
    targetBar: GanttBarObject,
    targetPoint: ConnectionPoint,
    e: MouseEvent
  ) => void

  cancelConnectionCreation: (e: MouseEvent) => void
  handleConnectionPointHover: (
    barId: string,
    point: ConnectionPoint | null,
    isEnter: boolean
  ) => void

  canBeConnectionTarget: ComputedRef<(bar: GanttBarObject) => boolean>
}

export interface ConnectionCreationService extends UseConnectionCreationReturn {}

export function useConnectionCreation(
  config: GGanttChartConfig,
  rowManager: UseRowsReturn,
  emit: {
    (e: "connection-start", value: ConnectionStartEvent): void
    (e: "connection-drag", value: ConnectionDragEvent): void
    (e: "connection-complete", value: ConnectionCompleteEvent): void
    (e: "connection-cancel", value: ConnectionStartEvent): void
  },
  reinitializeConnections: () => void
): UseConnectionCreationReturn {
  const connectionState = ref<ConnectionCreationState>({
    isCreating: false,
    sourceBar: null,
    sourcePoint: null,
    mouseX: 0,
    mouseY: 0
  })

  const hoverState = ref<ConnectionPointHoverState>({
    isVisible: false,
    barId: null,
    point: null
  })

  const validateConnection = (
    sourceBar: GanttBarObject,
    targetBar: GanttBarObject
  ): ConnectionValidation => {
    if (sourceBar.ganttBarConfig.id === targetBar.ganttBarConfig.id) {
      return { isValid: false, message: "Cannot connect a bar to itself" }
    }

    const existingConnection = sourceBar.ganttBarConfig.connections?.find(
      (conn) => conn.targetId === targetBar.ganttBarConfig.id
    )
    if (existingConnection) {
      return { isValid: false, message: "Existing connection" }
    }

    return { isValid: true }
  }

  const startConnectionCreation = (bar: GanttBarObject, point: ConnectionPoint, e: MouseEvent) => {
    connectionState.value = {
      isCreating: true,
      sourceBar: bar,
      sourcePoint: point,
      mouseX: e.clientX,
      mouseY: e.clientY
    }

    emit("connection-start", {
      sourceBar: bar,
      connectionPoint: point,
      e
    })
  }

  const updateConnectionDrag = (e: MouseEvent) => {
    if (!connectionState.value.isCreating) return

    connectionState.value.mouseX = e.clientX
    connectionState.value.mouseY = e.clientY

    emit("connection-drag", {
      sourceBar: connectionState.value.sourceBar!,
      connectionPoint: connectionState.value.sourcePoint!,
      currentX: e.clientX,
      currentY: e.clientY,
      e
    })
  }

  const completeConnection = (
    targetBar: GanttBarObject,
    targetPoint: ConnectionPoint,
    e: MouseEvent
  ) => {
    if (!connectionState.value.sourceBar) return

    const validation = validateConnection(connectionState.value.sourceBar, targetBar)

    if (validation.isValid) {
      const newConnection = {
        targetId: targetBar.ganttBarConfig.id,
        type: config.defaultConnectionType.value,
        color: config.defaultConnectionColor.value,
        pattern: config.defaultConnectionPattern.value,
        animated: config.defaultConnectionAnimated.value,
        animationSpeed: config.defaultConnectionAnimationSpeed.value
      }

      if (!connectionState.value.sourceBar.ganttBarConfig.connections) {
        connectionState.value.sourceBar.ganttBarConfig.connections = []
      }
      connectionState.value.sourceBar.ganttBarConfig.connections.push(newConnection)

      const updatedRows = [...rowManager.rows.value]
      rowManager.updateRows(updatedRows)

      reinitializeConnections()

      emit("connection-complete", {
        sourceBar: connectionState.value.sourceBar,
        targetBar,
        sourcePoint: connectionState.value.sourcePoint!,
        targetPoint,
        e
      })
    }

    resetConnectionState()
  }

  const handleConnectionPointHover = (
    barId: string,
    point: ConnectionPoint | null,
    isEnter: boolean
  ) => {
    hoverState.value = {
      isVisible: isEnter,
      barId: isEnter ? barId : null,
      point: isEnter ? point : null
    }
  }

  const cancelConnectionCreation = (e: MouseEvent) => {
    if (connectionState.value.sourceBar && connectionState.value.sourcePoint) {
      emit("connection-cancel", {
        sourceBar: connectionState.value.sourceBar,
        connectionPoint: connectionState.value.sourcePoint,
        e
      })
    }
    resetConnectionState()
  }

  const resetConnectionState = () => {
    connectionState.value = {
      isCreating: false,
      sourceBar: null,
      sourcePoint: null,
      mouseX: 0,
      mouseY: 0
    }
  }

  const canBeConnectionTarget = computed(() => (bar: GanttBarObject) => {
    if (!connectionState.value.sourceBar) return false
    return validateConnection(connectionState.value.sourceBar, bar).isValid
  })

  return {
    connectionState,
    hoverState,
    startConnectionCreation,
    updateConnectionDrag,
    completeConnection,
    cancelConnectionCreation,
    handleConnectionPointHover,
    canBeConnectionTarget
  }
}
