import { computed, ref, type Ref } from "vue"
import type {
  BarConnection,
  BarPosition,
  ChartRow,
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
  id: Ref<string>
) {
  const connections = ref<BarConnection[]>([])
  const barPositions = ref<Map<string, BarPosition>>(new Map())

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

    const defaultProps = {
      type: props.defaultConnectionType,
      color: props.defaultConnectionColor,
      pattern: props.defaultConnectionPattern,
      animated: props.defaultConnectionAnimated,
      animationSpeed: props.defaultConnectionAnimationSpeed
    }

    const connectionProps = {
      type: conn.type,
      color: conn.color,
      pattern: conn.pattern,
      animated: conn.animated,
      animationSpeed: conn.animationSpeed
    }

    return {
      sourceBar,
      targetBar,
      ...defaultProps,
      ...connectionProps
    }
  })

  /**
   * Initializes connections by processing all bars and their connection configurations
   * Extracts and normalizes connection data from bar configurations
   */
  const initializeConnections = () => {
    const getAllBars = (rows: ChartRow[]): GanttBarObject[] => {
      return rows.flatMap((row) => {
        const bars = [...row.bars]
        if (row.children?.length) {
          return [...bars, ...getAllBars(row.children)]
        }
        return bars
      })
    }

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
            animationSpeed: conn.animationSpeed
          })
        })
      }
    })
  }

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
    updateBarPositions
  }
}
