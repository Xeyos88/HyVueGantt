import { ref } from "vue"
import type { BarConnection, BarPosition, ChartRow } from "../types"

export function useConnections(getChartRows: () => ChartRow[]) {
  const connections = ref<BarConnection[]>([])
  const barPositions = ref<Map<string, BarPosition>>(new Map())

  const initializeConnections = () => {
    const flatBars = getChartRows().flatMap((el: ChartRow) => el.bars)

    flatBars.forEach((el) => {
      if (el.ganttBarConfig.connections?.length) {
        el.ganttBarConfig.connections.forEach((conn) => {
          connections.value.push({
            sourceId: el.ganttBarConfig.id,
            targetId: conn.targetId,
            type: conn.connectionType,
            color: conn.connectionColor,
            pattern: conn.connectionPattern
          })
        })
      }
    })
  }

  const updateBarPositions = async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const rowsContainer = document.querySelector(".g-gantt-rows-container")
    if (!rowsContainer) return

    const containerRect = rowsContainer.getBoundingClientRect()
    const bars = document.querySelectorAll(".g-gantt-bar")

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
    initializeConnections,
    updateBarPositions
  }
}
