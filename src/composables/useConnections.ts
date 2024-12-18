import { computed, ref, type Ref } from "vue"
import type { BarConnection, BarPosition, ChartRow, GGanttChartProps } from "../types"

export function useConnections(
  getChartRows: () => ChartRow[],
  props: GGanttChartProps,
  id: Ref<string>
) {
  const connections = ref<BarConnection[]>([])
  const barPositions = ref<Map<string, BarPosition>>(new Map())

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

  const initializeConnections = () => {
    const flatBars = getChartRows().flatMap((el: ChartRow) => el.bars)

    flatBars.forEach((el) => {
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

  const updateBarPositions = async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const parentElement = document.getElementById(id.value)
    const rowsContainer = parentElement!.querySelector(".g-gantt-rows-container")
    if (!rowsContainer) return

    const containerRect = rowsContainer.getBoundingClientRect()
    const bars = parentElement!.querySelectorAll(".g-gantt-bar")

    barPositions.value.clear()

    bars.forEach((bar) => {
      const rect = bar.getBoundingClientRect()
      const barId = bar.getAttribute("id")

      if (barId) {
        const position = {
          id: barId,
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
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
