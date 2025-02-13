<script setup lang="ts">
import type { BarPosition, ConnectionType, MarkerConnection } from "../types"
import { computed, ref } from "vue"

interface Props {
  sourceBar: BarPosition
  targetBar: BarPosition
  type?: ConnectionType
  color?: string
  strokeWidth?: number
  pattern?: "solid" | "dash" | "dot" | "dashdot"
  animated?: boolean
  animationSpeed?: "slow" | "normal" | "fast"
  marker: MarkerConnection
}

const props = withDefaults(defineProps<Props>(), {
  type: "straight",
  color: "#ff0000",
  strokeWidth: 2,
  pattern: "solid",
  animated: false,
  animationSpeed: "normal"
})

const pathRef = ref<SVGPathElement | null>(null)

const animationClass = computed(() => {
  if (!props.animated) return ""
  return `connector-animated-${props.pattern}-${props.animationSpeed}`
})

const markerId = computed(() => `marker-start-${props.sourceBar.id}-${props.targetBar.id}`)
const hasMarkerEnd = computed(() => props.marker === "bidirectional" || props.marker === "forward")
const hasMarkerStart = computed(() => props.marker === "bidirectional")
const markerDeltaEnd = computed(() => (hasMarkerEnd.value ? 4 : 0))
const markerDeltaStart = computed(() => (hasMarkerStart.value ? 4 : 0))

const pathData = computed(() => {
  const sourceX = props.sourceBar.x + props.sourceBar.width
  const sourceY = props.sourceBar.y + props.sourceBar.height / 2
  const targetX = props.targetBar.x
  const targetY = props.targetBar.y + props.targetBar.height / 2

  const OFFSET = 20
  const isGoingBack = targetX <= sourceX
  switch (props.type) {
    case "straight":
      return `M ${sourceX},${sourceY} L ${targetX - markerDeltaEnd.value},${targetY}`

    case "squared":
      if (isGoingBack) {
        return `M ${sourceX + markerDeltaStart.value},${sourceY}
                h ${OFFSET}
                v ${(targetY - sourceY) / 2}
                h -${Math.abs(targetX - sourceX) + OFFSET * 2}
                v ${(targetY - sourceY) / 2}
                h ${OFFSET - markerDeltaEnd.value * 2}`
      }

      return `M ${sourceX + markerDeltaStart.value},${sourceY}
              h ${OFFSET}
              v ${targetY - sourceY}
              h ${targetX - sourceX - OFFSET - markerDeltaEnd.value * 2}`

    case "bezier":
    default:
      const controlPointX = (sourceX + targetX) / 2
      return `M ${sourceX + markerDeltaStart.value},${sourceY}
              C ${controlPointX},${sourceY}
                ${controlPointX},${targetY}
                ${targetX - markerDeltaEnd.value},${targetY}`
  }
})

const nonAnimatedDashArray = computed(() => {
  if (props.animated) return undefined

  switch (props.pattern) {
    case "dash":
      return "8,8"
    case "dot":
      return "2,6"
    case "dashdot":
      return "12,6,3,6"
    default:
      return ""
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
      zIndex: 1001,
      overflow: 'visible'
    }"
  >
    <defs>
      <marker
        :id="markerId"
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" :fill="color" />
      </marker>
      <linearGradient
        v-if="animated && pattern === 'solid'"
        :id="`gradient-${sourceBar.id}-${targetBar.id}`"
        gradientUnits="userSpaceOnUse"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
      >
        <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
        <stop offset="45%" :stop-color="color" stop-opacity="1" />
        <stop offset="55%" :stop-color="color" stop-opacity="1" />
        <stop offset="100%" :stop-color="color" stop-opacity="0.3" />
        <animate
          attributeName="x1"
          from="-100%"
          to="100%"
          :dur="animationSpeed === 'slow' ? '4s' : animationSpeed === 'fast' ? '1s' : '2s'"
          repeatCount="indefinite"
        />
        <animate
          attributeName="x2"
          from="0%"
          to="200%"
          :dur="animationSpeed === 'slow' ? '4s' : animationSpeed === 'fast' ? '1s' : '2s'"
          repeatCount="indefinite"
        />
      </linearGradient>
    </defs>

    <path
      ref="pathRef"
      :d="pathData"
      fill="none"
      :stroke="
        animated && pattern === 'solid' ? `url(#gradient-${sourceBar.id}-${targetBar.id})` : color
      "
      :stroke-width="strokeWidth"
      :stroke-dasharray="nonAnimatedDashArray"
      :class="['connector-path', animationClass]"
      :style="{
        markerStart: hasMarkerStart ? `url(#${markerId})` : 'none',
        markerEnd: hasMarkerEnd ? `url(#${markerId})` : 'none'
      }"
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

/* Animazione per pattern dash */
.connector-animated-dash-slow {
  animation: dashFlow 4s linear infinite;
}
.connector-animated-dash-normal {
  animation: dashFlow 2s linear infinite;
}
.connector-animated-dash-fast {
  animation: dashFlow 1s linear infinite;
}

/* Animazione per pattern dot */
.connector-animated-dot-slow {
  animation: dotFlow 4s linear infinite;
}
.connector-animated-dot-normal {
  animation: dotFlow 2s linear infinite;
}
.connector-animated-dot-fast {
  animation: dotFlow 1s linear infinite;
}

/* Animazione per pattern dashdot */
.connector-animated-dashdot-slow {
  animation: dashdotFlow 4s linear infinite;
}
.connector-animated-dashdot-normal {
  animation: dashdotFlow 2s linear infinite;
}
.connector-animated-dashdot-fast {
  animation: dashdotFlow 1s linear infinite;
}

.connector-path {
  marker-start: none;
  transition:
    d 0.3s ease,
    marker-start 0.3s ease;
}

@keyframes dashFlow {
  0% {
    stroke-dasharray: 10, 10;
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dasharray: 10, 10;
    stroke-dashoffset: -20;
  }
}

@keyframes dotFlow {
  0% {
    stroke-dasharray: 2, 8;
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dasharray: 2, 8;
    stroke-dashoffset: -10;
  }
}

@keyframes dashdotFlow {
  0% {
    stroke-dasharray: 12, 6, 3, 6;
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dasharray: 12, 6, 3, 6;
    stroke-dashoffset: -27;
  }
}
</style>
