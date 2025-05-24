import { computed, ref, type Ref, watch } from "vue"
import type {
  BarConnection,
  BarPosition,
  ChartRow,
  ConnectionDeleteEvent,
  GanttBarObject,
  GGanttChartProps
} from "../types"
import type { UseRowsReturn } from "./useRows"

/**
 * A composable that manages connections between bars in the Gantt chart
 * Handles connection rendering, positioning, and updates
 * @param rowManager - Row management utilities
 * @param props - Gantt chart properties
 * @param id - Unique identifier for the chart instance
 * @returns Object containing connection state and management methods
 */
export function useConnections(
  rowManager: UseRowsReturn,
  props: GGanttChartProps,
  id: Ref<string>,
  emit: {
    (e: "connection-delete", value: ConnectionDeleteEvent): void
  }
) {
  const connections = ref<BarConnection[]>([])
  const barPositions = ref<Map<string, BarPosition>>(new Map())
  const selectedConnection = ref<BarConnection | null>(null)

  /**
   * Computed property that generates connector properties for rendering
   * Merges default and custom connection properties
   */
  const getConnectorProps = computed(() => (conn: BarConnection) => {
    const sourceBar = barPositions.value.get(conn.sourceId)
    const targetBar = barPositions.value.get(conn.targetId)

    if (!sourceBar || !targetBar) {
      return null
    }
    const connectionProps = {
      type: conn.type ?? props.defaultConnectionType,
      color: conn.color ?? props.defaultConnectionColor,
      pattern: conn.pattern ?? props.defaultConnectionPattern,
      animated: conn.animated ?? props.defaultConnectionAnimated,
      animationSpeed: conn.animationSpeed ?? props.defaultConnectionAnimationSpeed,
      relation: conn.relation ?? props.defaultConnectionRelation,
      label: conn.label ?? props.defaultConnectionLabel,
      labelAlwaysVisible: conn.labelAlwaysVisible ?? props.defaultConnectionLabelAlwaysVisible,
      labelStyle: conn.labelStyle ?? props.defaultConnectionLabelStyle,
      isSelected:
        selectedConnection.value?.sourceId === conn.sourceId &&
        selectedConnection.value?.targetId === conn.targetId
    }

    return {
      sourceBar,
      targetBar,
      ...connectionProps
    }
  })

  const handleConnectionClick = (connection: BarConnection) => {
    if (
      selectedConnection.value?.sourceId === connection.sourceId &&
      selectedConnection.value?.targetId === connection.targetId
    ) {
      selectedConnection.value = null
    } else {
      selectedConnection.value = connection
    }
  }

  const deleteSelectedConnection = () => {
    if (!selectedConnection.value) return

    const allBars = getAllBars(rowManager.rows.value)
    const sourceBar = allBars.find(
      (bar) => bar.ganttBarConfig.id === selectedConnection.value?.sourceId
    )

    if (sourceBar && sourceBar.ganttBarConfig.connections) {
      sourceBar.ganttBarConfig.connections = sourceBar.ganttBarConfig.connections.filter(
        (conn) => conn.targetId !== selectedConnection.value?.targetId
      )

      const targetBar = allBars.find(
        (bar) => bar.ganttBarConfig.id === selectedConnection.value?.targetId
      )!

      emit("connection-delete", {
        sourceBar,
        targetBar,
        e: new MouseEvent("mouseup")
      })

      selectedConnection.value = null
      initializeConnections()
      rowManager.onBarMove()
    }
  }

  const getAllBars = (rows: ChartRow[]): GanttBarObject[] => {
    return rows.flatMap((row) => {
      const bars = [...row.bars]
      if (row.children?.length) {
        return [...bars, ...getAllBars(row.children)]
      }
      return bars
    })
  }

  /**
   * Initializes connections by processing all bars and their connection configurations
   * Extracts and normalizes connection data from bar configurations
   */
  const initializeConnections = () => {
    connections.value = []

    const allBars = getAllBars(rowManager.rows.value)

    allBars.forEach((el) => {
      if (el.ganttBarConfig.connections?.length) {
        el.ganttBarConfig.connections.forEach((conn) => {
          connections.value.push({
            sourceId: el.ganttBarConfig.id,
            targetId: conn.targetId,
            type: conn.type,
            color: conn.color,
            pattern: conn.pattern,
            animated: conn.animated,
            animationSpeed: conn.animationSpeed,
            relation: conn.relation,
            label: conn.label,
            labelAlwaysVisible: conn.labelAlwaysVisible,
            labelStyle: conn.labelStyle
          })
        })
      }
    })
  }

  watch(
    () => rowManager.rows.value,
    () => {
      initializeConnections()
    },
    { deep: true }
  )

  /**
   * Updates the positions of all bars in the chart
   * Calculates and stores positions accounting for scroll offsets
   */
  const updateBarPositions = async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const parentElement = document.getElementById(id.value)
    const rowsContainer = parentElement!.querySelector(".g-gantt-rows-container")
    if (!rowsContainer) return
    const scrollTop = rowsContainer.scrollTop
    const scrollLeft = rowsContainer.scrollLeft

    const containerRect = rowsContainer.getBoundingClientRect()
    const bars = parentElement!.querySelectorAll(".g-gantt-bar")

    barPositions.value.clear()

    bars.forEach((bar) => {
      const rect = bar.getBoundingClientRect()
      const barId = bar.getAttribute("id")

      if (barId) {
        const position = {
          id: barId,
          x: rect.left - containerRect.left + scrollLeft,
          y: rect.top - containerRect.top + scrollTop,
          width: rect.width,
          height: rect.height
        }
        barPositions.value.set(barId, position)
      }
    })
  }

  return {
    connections,
    barPositions,
    getConnectorProps,
    initializeConnections,
    updateBarPositions,
    handleConnectionClick,
    selectedConnection,
    deleteSelectedConnection
  }
}
