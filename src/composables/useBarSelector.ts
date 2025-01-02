/**
 * Helper for selecting bar elements within a specific gantt chart
 */
export default function useBarSelector() {
  /**
   * Finds a bar element within a specific gantt chart
   * @param ganttId - ID of the gantt container
   * @param barId - ID of the bar to find
   * @returns HTMLElement | null
   */
  const findBarElement = (ganttId: string, barId: string): HTMLElement | null => {
    const ganttContainer = document.getElementById(ganttId)
    if (!ganttContainer) return null

    return ganttContainer.querySelector(`#${barId}`) as HTMLElement
  }

  /**
   * Finds all bar elements within a specific gantt chart
   * @param ganttId - ID of the gantt container
   * @returns NodeListOf<HTMLElement>
   */
  const findAllBarElements = (ganttId: string): NodeListOf<HTMLElement> => {
    const ganttContainer = document.getElementById(ganttId)
    if (!ganttContainer) return document.querySelectorAll(".non-existent")

    return ganttContainer.querySelectorAll(".g-gantt-bar")
  }

  /**
   * Checks if a bar exists within a specific gantt chart
   * @param ganttId - ID of the gantt container
   * @param barId - ID of the bar to check
   * @returns boolean
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
