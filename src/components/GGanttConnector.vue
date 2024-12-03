<script setup lang="ts">
import { computed } from "vue"

interface BarPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

type ConnectionType = "bezier" | "straight" | "squared"

interface Props {
  sourceBar: BarPosition
  targetBar: BarPosition
  type?: ConnectionType
  color?: string
  strokeWidth?: number
  dashArray?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: "straight",
  color: "#ff0000",
  strokeWidth: 2,
  dashArray: ""
})

const pathData = computed(() => {
  const sourceX = props.sourceBar.x + props.sourceBar.width
  const sourceY = props.sourceBar.y + props.sourceBar.height / 2
  const targetX = props.targetBar.x
  const targetY = props.targetBar.y + props.targetBar.height / 2

  switch (props.type) {
    case "straight":
      return `M ${sourceX},${sourceY} L ${targetX},${targetY}`

    case "squared":
      const middleX = (sourceX + targetX) / 2
      return `M ${sourceX},${sourceY} 
              L ${middleX},${sourceY} 
              L ${middleX},${targetY} 
              L ${targetX},${targetY}`

    case "bezier":
    default:
      const controlPointX = (sourceX + targetX) / 2
      return `M ${sourceX},${sourceY} 
              C ${controlPointX},${sourceY} 
                ${controlPointX},${targetY} 
                ${targetX},${targetY}`
  }
})
</script>

<template>
  <svg
    class="gantt-connector"
    :style="{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1,
      overflow: 'visible'
    }"
  >
    <path
      :d="pathData"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      :stroke-dasharray="dashArray"
      class="connector-path"
    />
  </svg>
</template>

<style scoped>
.gantt-connector {
  overflow: visible;
}

.connector-path {
  transition: d 0.3s ease;
}
</style>
