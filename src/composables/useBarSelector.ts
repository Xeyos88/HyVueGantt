/**
 * A composable that provides utility functions for selecting and managing bar elements in the DOM
 * Centralizes DOM selection logic for Gantt chart bars
 */
export default function useBarSelector() {
  /**
   * Finds a specific bar element within a Gantt chart
   * Uses scoped selection to avoid conflicts with multiple charts
   * @param ganttId - ID of the parent Gantt chart container
   * @param barId - ID of the bar to find
   * @returns HTMLElement of the bar or null if not found
   */
  const findBarElement = (ganttId: string, barId: string): HTMLElement | null => {
    const ganttContainer = document.getElementById(ganttId)
    if (!ganttContainer) return null

    return ganttContainer.querySelector(`#${CSS.escape(barId)}`) as HTMLElement
  }

  /**
   * Finds all bar elements within a specific Gantt chart
   * @param ganttId - ID of the Gantt chart container
   * @returns NodeList of all bar elements
   */
  const findAllBarElements = (ganttId: string): NodeListOf<HTMLElement> => {
    const ganttContainer = document.getElementById(ganttId)
    if (!ganttContainer) return document.querySelectorAll(".non-existent")

    return ganttContainer.querySelectorAll(".g-gantt-bar")
  }

  /**
   * Checks if a specific bar exists within a Gantt chart
   * @param ganttId - ID of the Gantt chart container
   * @param barId - ID of the bar to check
   * @returns Boolean indicating if the bar exists
   */
  const barExistsInGantt = (ganttId: string, barId: string): boolean => {
    return !!findBarElement(ganttId, barId)
  }

  return {
    findBarElement,
    findAllBarElements,
    barExistsInGantt
  }
}
