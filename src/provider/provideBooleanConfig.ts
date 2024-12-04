import { inject } from "vue"
import { BOOLEAN_KEY } from "./symbols"

export default function provideBooleanConfig() {
  const config = inject(BOOLEAN_KEY)
  if (!config) {
    throw Error("Failed to inject config!")
  }
  return config
}
