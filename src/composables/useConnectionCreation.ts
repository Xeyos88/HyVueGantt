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
  ConnectionPoint,
  ConnectionRelation
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

/**
 * A composable that manages the creation and manipulation of connections between bars in the Gantt chart
 * Allows users to draw connections between bars through drag-and-drop interactions
 * Handles validation, visual feedback, and actual connection creation
 *
 * @param config - Gantt chart configuration
 * @param rowManager - Row management utilities
 * @param emit - Function to emit events
 * @param reinitializeConnections - Function to reinitialize connections after creation/modification
 * @returns Object containing connection state and management methods
 */
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
  /**
   * Connection creation state
   * Contains information about source bar, connection point, and mouse position
   */
  const connectionState = ref<ConnectionCreationState>({
    isCreating: false,
    sourceBar: null,
    sourcePoint: null,
    mouseX: 0,
    mouseY: 0
  })

  /**
   * Connection point hover state
   * Tracks which connection points the user is hovering over
   */
  const hoverState = ref<ConnectionPointHoverState>({
    isVisible: false,
    barId: null,
    point: null
  })

  /**
   * Validates a potential connection between two bars
   * Checks that the connection is logically valid and not a duplicate
   * @param sourceBar - Source bar of the connection
   * @param targetBar - Target bar of the connection
   * @returns Object containing connection validity information
   */
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

  /**
   * Determines the relation type based on source and target connection points
   * @param sourcePoint - Connection point from source bar
   * @param targetPoint - Connection point on target bar
   * @returns Connection relation type
   */
  const determineRelationType = (
    sourcePoint: ConnectionPoint,
    targetPoint: ConnectionPoint
  ): ConnectionRelation => {
    if (sourcePoint === "end" && targetPoint === "start") return "FS"
    if (sourcePoint === "start" && targetPoint === "start") return "SS"
    if (sourcePoint === "end" && targetPoint === "end") return "FF"
    if (sourcePoint === "start" && targetPoint === "end") return "SF"

    return "FS"
  }

  /**
   * Starts the creation of a connection
   * Sets up initial state and emits connection start event
   * @param bar - Source bar for the connection
   * @param point - Connection point (start or end of the bar)
   * @param e - Mouse event that initiated creation
   */
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

  /**
   * Updates connection position during dragging
   * Tracks mouse position and emits drag events
   * @param e - Mouse move event during drag
   */
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

  /**
   * Completes the creation of a connection
   * Validates and creates the connection between specified bars
   * @param targetBar - Target bar for the connection
   * @param targetPoint - Connection point on the target bar
   * @param e - Mouse event that completed the connection
   */
  const completeConnection = (
    targetBar: GanttBarObject,
    targetPoint: ConnectionPoint,
    e: MouseEvent
  ) => {
    if (!connectionState.value.sourceBar || !connectionState.value.sourcePoint) return

    const validation = validateConnection(connectionState.value.sourceBar, targetBar)

    if (validation.isValid) {
      const relation = determineRelationType(connectionState.value.sourcePoint, targetPoint)

      const newConnection = {
        targetId: targetBar.ganttBarConfig.id,
        type: config.defaultConnectionType.value,
        color: config.defaultConnectionColor.value,
        pattern: config.defaultConnectionPattern.value,
        animated: config.defaultConnectionAnimated.value,
        animationSpeed: config.defaultConnectionAnimationSpeed.value,
        relation,
        label: config.defaultConnectionLabel?.value,
        labelAlwaysVisible: config.defaultConnectionLabelAlwaysVisible?.value,
        labelStyle: config.defaultConnectionLabelStyle?.value
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
        sourcePoint: connectionState.value.sourcePoint,
        targetPoint,
        e
      })
    }

    resetConnectionState()
  }

  /**
   * Handles connection point hover events
   * Updates hover state when user enters or leaves a connection point
   * @param barId - ID of the bar being hovered
   * @param point - Connection point (start or end)
   * @param isEnter - Whether mouse is entering or leaving the point
   */
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

  /**
   * Cancels the creation of a connection
   * Resets state and emits cancellation event
   * @param e - Mouse event that caused cancellation
   */
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

  /**
   * Resets connection creation state
   * Used after completion or cancellation of a connection
   */
  const resetConnectionState = () => {
    connectionState.value = {
      isCreating: false,
      sourceBar: null,
      sourcePoint: null,
      mouseX: 0,
      mouseY: 0
    }
  }

  /**
   * Determines if a bar can be a connection target
   * Checks if connection from current bar to specified bar is valid
   */
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
