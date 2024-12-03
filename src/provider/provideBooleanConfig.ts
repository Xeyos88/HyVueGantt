import { inject } from "vue"
import { BOOLEAN_KEY } from "./symbols.js"

export default function provideBooleanConfig() {
  const config = inject(BOOLEAN_KEY)
  if (!config) {
    throw Error("Failed to inject config!")
  }
  return config
}
