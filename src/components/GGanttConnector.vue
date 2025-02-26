<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { computed, ref } from "vue"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Provider
import provideConfig from "../provider/provideConfig"

// Types
import type { BarPosition, ConnectionType, MarkerConnection } from "../types"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
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
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: "straight",
  color: "#ff0000",
  strokeWidth: 2,
  pattern: "solid",
  animated: false,
  animationSpeed: "normal",
  isSelected: false
})

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------
const { enableConnectionDeletion } = provideConfig()
const pathRef = ref<SVGPathElement | null>(null)

// -----------------------------
// 5. COMPUTED PROPERTIES
// -----------------------------

/**
 * Computed class for animation based on connection properties
 */
const animationClass = computed(() => {
  if (!props.animated) return ""
  return `connector-animated-${props.pattern}-${props.animationSpeed}`
})

/**
 * Unique marker ID for this connection
 */
const markerId = computed(() => `marker-start-${props.sourceBar.id}-${props.targetBar.id}`)

/**
 * Whether to show end marker (arrow)
 */
const hasMarkerEnd = computed(() => props.marker === "bidirectional" || props.marker === "forward")

/**
 * Whether to show start marker (arrow)
 */
const hasMarkerStart = computed(() => props.marker === "bidirectional")

/**
 * Adjustment value for end marker positioning
 */
const markerDeltaEnd = computed(() => (hasMarkerEnd.value ? 4 : 0))

/**
 * Adjustment value for start marker positioning
 */
const markerDeltaStart = computed(() => (hasMarkerStart.value ? 4 : 0))

/**
 * Computed SVG path for the connection based on connection type
 */
const pathData = computed(() => {
  const sourceX = props.sourceBar.x + props.sourceBar.width
  const sourceY = props.sourceBar.y + props.sourceBar.height / 2
  const targetX = props.targetBar.x
  const targetY = props.targetBar.y + props.targetBar.height / 2

  const OFFSET = 20
  const isGoingBack = targetX <= sourceX

  switch (props.type) {
    case "straight":
      // Direct line from source to target
      return `M ${sourceX},${sourceY} L ${targetX - markerDeltaEnd.value},${targetY}`

    case "squared":
      if (isGoingBack) {
        // Special case for backwards connections with square corners
        return `M ${sourceX + markerDeltaStart.value},${sourceY}
                h ${OFFSET}
                v ${(targetY - sourceY) / 2}
                h -${Math.abs(targetX - sourceX) + OFFSET * 2}
                v ${(targetY - sourceY) / 2}
                h ${OFFSET - markerDeltaEnd.value * 2}`
      }

      // Forward connection with square corners
      return `M ${sourceX + markerDeltaStart.value},${sourceY}
              h ${OFFSET}
              v ${targetY - sourceY}
              h ${targetX - sourceX - OFFSET - markerDeltaEnd.value * 2}`

    case "bezier":
    default:
      // Curved connection using Bezier curve
      const controlPointX = (sourceX + targetX) / 2
      return `M ${sourceX + markerDeltaStart.value},${sourceY}
              C ${controlPointX},${sourceY}
                ${controlPointX},${targetY}
                ${targetX - markerDeltaEnd.value},${targetY}`
  }
})

/**
 * Dash array pattern for non-animated connections
 */
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

/**
 * Compute stroke width, making it larger when selected
 */
const getStrokeWidth = computed(() => {
  if (props.isSelected && enableConnectionDeletion.value) {
    return props.strokeWidth * 1.5
  }
  return props.strokeWidth
})
</script>

<template>
  <!-- Connection SVG Container -->
  <svg
    class="gantt-connector"
    :style="{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1001,
      overflow: 'visible'
    }"
  >
    <!-- Definitions for markers and gradients -->
    <defs>
      <!-- Arrow marker definition for connection endpoints -->
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

      <!-- Gradient definition for animated solid connections -->
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

    <!-- Connection path -->
    <path
      ref="pathRef"
      :d="pathData"
      fill="none"
      :stroke="
        animated && pattern === 'solid' ? `url(#gradient-${sourceBar.id}-${targetBar.id})` : color
      "
      :stroke-width="getStrokeWidth"
      :stroke-dasharray="nonAnimatedDashArray"
      :class="[
        'connector-path',
        animationClass,
        { selected: isSelected && enableConnectionDeletion }
      ]"
      :style="{
        markerStart: hasMarkerStart ? `url(#${markerId})` : 'none',
        markerEnd: hasMarkerEnd ? `url(#${markerId})` : 'none',
        cursor: enableConnectionDeletion ? 'pointer' : 'inherit',
        pointerEvents: enableConnectionDeletion ? 'all' : 'none'
      }"
    />

    <!-- Selection indicators shown when connection is selected -->
    <template v-if="isSelected && enableConnectionDeletion">
      <circle
        :cx="sourceBar.x + sourceBar.width"
        :cy="sourceBar.y + sourceBar.height / 2"
        r="6"
        fill="white"
        class="connection-endpoint"
      />
      <circle
        :cx="targetBar.x"
        :cy="targetBar.y + targetBar.height / 2"
        r="6"
        fill="white"
        class="connection-endpoint"
      />
    </template>
  </svg>
</template>

<style scoped>
.gantt-connector {
  overflow: visible;
  pointer-events: none;
}

.connector-path {
  transition: d 0.3s ease;
}

.connector-path.selected {
  filter: drop-shadow(0 0 5px rgba(33, 150, 243, 0.6));
}

/* Animation for dash pattern */
.connector-animated-dash-slow {
  animation: dashFlow 4s linear infinite;
}
.connector-animated-dash-normal {
  animation: dashFlow 2s linear infinite;
}
.connector-animated-dash-fast {
  animation: dashFlow 1s linear infinite;
}

/* Animation for dot pattern */
.connector-animated-dot-slow {
  animation: dotFlow 4s linear infinite;
}
.connector-animated-dot-normal {
  animation: dotFlow 2s linear infinite;
}
.connector-animated-dot-fast {
  animation: dotFlow 1s linear infinite;
}

/* Animation for dashdot pattern */
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

.connection-endpoint {
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
  border: 1px solid black;
  border-radius: 100%;
}

.connection-endpoint:hover {
  r: 8;
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
