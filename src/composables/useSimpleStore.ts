/**
 * A simple store composable that manages global gantt width state
 * Used for sharing width information across components
 * @returns Ref containing the current gantt width
 */
import { ref } from "vue"

export const ganttWidth = ref()
