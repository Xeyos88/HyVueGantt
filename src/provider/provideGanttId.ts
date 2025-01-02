import { inject } from "vue"

import { GANTT_ID_KEY } from "./symbols"

export default function provideGanttId() {
  const ganttId = inject(GANTT_ID_KEY)
  if (!ganttId) {
    throw Error("Failed to inject ganttId!")
  }
  return ganttId
}
