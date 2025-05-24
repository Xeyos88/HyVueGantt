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
import type {
  BarPosition,
  ConnectionType,
  MarkerConnection,
  ConnectionRelation,
  ConnectionLabelStyle
} from "../types"

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
  relation?: ConnectionRelation
  label?: string
  labelAlwaysVisible?: boolean
  labelStyle?: ConnectionLabelStyle
}

const props = withDefaults(defineProps<Props>(), {
  type: "straight",
  color: "#ff0000",
  strokeWidth: 2,
  pattern: "solid",
  animated: false,
  animationSpeed: "normal",
  isSelected: false,
  relation: "FS",
  label: "",
  labelAlwaysVisible: false,
  labelStyle: () => ({})
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
const markerId = computed(() => `marker-${props.sourceBar.id}-${props.targetBar.id}`)

/**
 * Whether to show end marker (arrow)
 */
const hasMarkerEnd = computed(() => props.marker === "bidirectional" || props.marker === "forward")

/**
 * Whether to show start marker (arrow)
 */
const hasMarkerStart = computed(() => props.marker === "bidirectional")

/**
 * Adjustment value for marker positioning
 */
const markerDelta = computed(() => 4)

/**
 * Determines if label should be shown
 */
const shouldShowLabel = computed(() => {
  return props.label && (props.labelAlwaysVisible || props.isSelected)
})

/**
 * Computed style for the label
 */
const labelComputedStyle = computed(() => {
  const defaultStyle = {
    fill: props.color,
    fontWeight: "bold"
  }

  return {
    ...defaultStyle,
    ...props.labelStyle
  }
})

/**
 * Determines connection points based on relation type
 */
const connectionPoints = computed(() => {
  const { sourceBar, targetBar, relation } = props

  switch (relation) {
    case "FS": // Finish to Start (default)
      return {
        sourceX: sourceBar.x + sourceBar.width,
        sourceY: sourceBar.y + sourceBar.height / 2,
        targetX: targetBar.x,
        targetY: targetBar.y + targetBar.height / 2
      }
    case "SS": // Start to Start
      return {
        sourceX: sourceBar.x,
        sourceY: sourceBar.y + sourceBar.height / 2,
        targetX: targetBar.x,
        targetY: targetBar.y + targetBar.height / 2
      }
    case "FF": // Finish to Finish
      return {
        sourceX: sourceBar.x + sourceBar.width,
        sourceY: sourceBar.y + sourceBar.height / 2,
        targetX: targetBar.x + targetBar.width,
        targetY: targetBar.y + targetBar.height / 2
      }
    case "SF": // Start to Finish
      return {
        sourceX: sourceBar.x,
        sourceY: sourceBar.y + sourceBar.height / 2,
        targetX: targetBar.x + targetBar.width,
        targetY: targetBar.y + targetBar.height / 2
      }
    default:
      return {
        sourceX: sourceBar.x + sourceBar.width,
        sourceY: sourceBar.y + sourceBar.height / 2,
        targetX: targetBar.x,
        targetY: targetBar.y + targetBar.height / 2
      }
  }
})

const STANDARD_OFFSET = 20

/**
 * Computed SVG path for the connection based on connection type and relation
 */
const pathData = computed(() => {
  const { sourceX, sourceY, targetX, targetY } = connectionPoints.value
  const { relation, type } = props

  const verticalDiff = targetY - sourceY

  const extraOffset = relation === "FF" || relation === "SF" ? 20 : 0

  const horizontalSpace = targetX - sourceX

  const isOverlapping = Math.abs(horizontalSpace) < STANDARD_OFFSET * (relation === "FS" ? 1 : 2)
  const offset = isOverlapping
    ? Math.max(STANDARD_OFFSET, Math.abs(horizontalSpace) / 2)
    : STANDARD_OFFSET

  const verticalOffset = verticalDiff === 0 && isOverlapping ? 20 : 0

  const startAdjust = hasMarkerStart.value ? markerDelta.value : 0
  const endAdjust = hasMarkerEnd.value ? markerDelta.value : 0

  switch (type) {
    case "straight":
      if (isOverlapping) {
        const midY = (sourceY + targetY) / 2 + verticalOffset * (sourceY > targetY ? -1 : 1)
        return `M ${sourceX + startAdjust},${sourceY} 
                Q ${sourceX + offset},${midY} ${(sourceX + targetX) / 2},${midY} 
                Q ${targetX - offset},${midY} ${targetX - endAdjust},${targetY}`
      } else {
        return `M ${sourceX + startAdjust},${sourceY} L ${targetX - endAdjust},${targetY}`
      }

    case "squared":
      if (relation === "FS") {
        // FS - Finish to Start
        return `M ${sourceX + startAdjust},${sourceY}
                  h ${offset / 2}
                  v ${verticalDiff}
                  h ${horizontalSpace - offset / 2 - endAdjust}`
      } else if (relation === "SS") {
        // SS - Start to Start
        return `M ${sourceX + startAdjust},${sourceY}
                  h ${-offset / 2}
                  v ${verticalDiff}
                  h ${horizontalSpace + offset / 2 - endAdjust}`
      } else if (relation === "FF") {
        // FF - Finish to Finish
        return `M ${sourceX + startAdjust},${sourceY}
                h ${offset / 2}
                v ${verticalDiff / 2}
                h ${horizontalSpace + offset / 2}
                v ${verticalDiff / 2}
                h ${-offset / 2 - endAdjust}`
      } else if (relation === "SF") {
        // SF - Start to Finish
        return `M ${sourceX + startAdjust},${sourceY}
                h ${-offset / 2}
                v ${verticalDiff / 2}
                h ${horizontalSpace + offset * 1.5}
                v ${verticalDiff / 2}
                h ${-offset / 2 - endAdjust}`
      }

      return `M ${sourceX + startAdjust},${sourceY}
              h ${offset}
              v ${verticalDiff}
              h ${horizontalSpace - offset - endAdjust}`

    case "bezier":
    default:
      let controlOffset = Math.max(Math.abs(horizontalSpace) / 3, offset * 1.5)
      if (isOverlapping) controlOffset = Math.max(controlOffset, offset * 2)

      if (relation === "FF" || relation === "SF") {
        const midX = targetX + extraOffset

        return `M ${sourceX + (hasMarkerStart.value ? startAdjust : 0)},${sourceY}
                C ${midX},${sourceY}
                  ${midX},${targetY}
                  ${targetX + (hasMarkerEnd.value ? endAdjust : 0)},${targetY}`
      } else {
        let cp1x, cp2x

        switch (relation) {
          case "FS":
            cp1x = sourceX + controlOffset
            cp2x = targetX - controlOffset
            break
          case "SS":
            cp1x = sourceX - controlOffset
            cp2x = targetX - controlOffset
            break
          default:
            cp1x = sourceX + controlOffset
            cp2x = targetX - controlOffset
        }

        return `M ${sourceX + (hasMarkerStart.value ? startAdjust : 0)},${sourceY}
                C ${cp1x},${sourceY}
                  ${cp2x},${targetY}
                  ${targetX - (hasMarkerEnd.value ? endAdjust : 0)},${targetY}`
      }
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

const endpointPositions = computed(() => {
  const { sourceX, sourceY, targetX, targetY } = connectionPoints.value
  return {
    source: { x: sourceX, y: sourceY },
    target: { x: targetX, y: targetY }
  }
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
        { selected: isSelected && enableConnectionDeletion },
        `connector-relation-${relation || 'FS'}`
      ]"
      :style="{
        markerStart: hasMarkerStart ? `url(#${markerId})` : 'none',
        markerEnd: hasMarkerEnd ? `url(#${markerId})` : 'none',
        cursor: enableConnectionDeletion ? 'pointer' : 'inherit',
        pointerEvents: enableConnectionDeletion ? 'all' : 'none'
      }"
    />

    <!-- Connection label -->
    <text
      v-if="shouldShowLabel"
      :x="(endpointPositions.source.x + endpointPositions.target.x) / 2 - 50"
      :y="(endpointPositions.source.y + endpointPositions.target.y) / 2 - 20"
      class="connection-label-container"
      text-anchor="middle"
      :style="{
        pointerEvents: 'none',
        ...labelComputedStyle
      }"
    >
      {{ label }}
    </text>

    <template v-if="isSelected && enableConnectionDeletion">
      <circle
        :cx="endpointPositions.source.x"
        :cy="endpointPositions.source.y"
        r="6"
        fill="white"
        class="connection-endpoint"
      />
      <circle
        :cx="endpointPositions.target.x"
        :cy="endpointPositions.target.y"
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

.relation-indicator {
  font-weight: bold;
  pointer-events: none;
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
