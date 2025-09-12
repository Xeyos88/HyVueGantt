<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { computed, ref, toRefs, watch, onMounted, inject } from "vue"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Composables
import useBarDragManagement from "../composables/useBarDragManagement"
import useTimePositionMapping from "../composables/useTimePositionMapping"
import useBarDragLimit from "../composables/useBarDragLimit"
import { useBarKeyboardControl } from "../composables/useBarKeyboardControl"
import { useTouchEvents } from "../composables/useTouchEvents"

// Types
import type { ConnectionPoint, GanttBarObject } from "../types"

// Provider
import provideEmitBarEvent from "../provider/provideEmitBarEvent"
import provideConfig from "../provider/provideConfig"
import { BAR_CONTAINER_KEY, GANTT_ID_KEY } from "../provider/symbols"
import useBarSelector from "../composables/useBarSelector"
import type { UseConnectionCreationReturn } from "../composables/useConnectionCreation"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  bar: GanttBarObject
}>()

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------
const ganttId = inject(GANTT_ID_KEY)!
const connectionCreation = inject<UseConnectionCreationReturn>("connectionCreation")

const emitBarEvent = provideEmitBarEvent()
const config = provideConfig()
const { rowHeight } = config

const { bar } = toRefs(props)
const { mapTimeToPosition, mapPositionToTime } = useTimePositionMapping()
const { initDragOfBar, initDragOfBundle } = useBarDragManagement()
const { setDragLimitsOfGanttBar } = useBarDragLimit()

const isDragging = ref(false)

const isEditing = ref(false)
const editedLabel = ref("")
const labelInput = ref<HTMLInputElement | null>(null)

// Extract configuration properties from provider
const {
  barStart,
  barEnd,
  width,
  chartStart,
  chartEnd,
  chartSize,
  showLabel,
  showGroupLabel,
  showProgress,
  defaultProgressResizable,
  enableConnectionCreation,
  barLabelEditable,
  showPlannedBars
} = config

// Position coordinates
const xStart = ref(0)
const xEnd = ref(0)

// Position coordinates for planned bar
const xStartPlanned = ref(0)
const xEndPlanned = ref(0)

// -----------------------------
// 5. COMPUTED PROPERTIES
// -----------------------------

// Bar configuration
const barConfig = computed(() => bar.value.ganttBarConfig)

// Check if bar is a group bar
const isGroupBar = computed(() => {
  return bar.value.ganttBarConfig.id.startsWith("group-")
})

// Check if bar has planned dates
const hasPlannedDates = computed(() => {
  return (
    showPlannedBars.value &&
    bar.value.start_planned !== undefined &&
    bar.value.end_planned !== undefined
  )
})

// Style for planned bar - independent positioning
const plannedBarStyle = computed(() => {
  const defaultStyle = {
    background: "#9e9e9e",
    opacity: 0.7
  }

  const customStyle = bar.value.ganttBarConfig.plannedStyle || {}

  return {
    ...defaultStyle,
    ...customStyle,
    position: "absolute" as const,
    top: `${rowHeight.value * 0.85}px`, // Positioned at the bottom of the row
    left: `${xStartPlanned.value}px`,
    width: `${xEndPlanned.value - xStartPlanned.value}px`,
    height: `${rowHeight.value * 0.15}px`, // Half of the remaining space (rowHeight - mainBarHeight) / 2
    zIndex: "1",
    pointerEvents: "none" as const
  }
})

// Style for progress bar
const progressStyle = computed(() => {
  const progress = props.bar.ganttBarConfig.progress ?? 0
  const baseStyle = props.bar.ganttBarConfig.progressStyle || {}
  const barColor = props.bar.ganttBarConfig.style?.background || "#5F9EA0"

  return {
    ...baseStyle,
    left: 0,
    width: `${Math.min(Math.max(progress, 0), 100)}%`,
    backgroundColor: baseStyle.backgroundColor || getDarkerColor(barColor as string),
    transition: "width 0.3s ease",
    borderRadius: "inherit",
    height: "100%"
  }
})

// Style for connection points
const connectionPointStyle = computed(() => ({
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  cursor: "pointer",
  background: canBeTarget.value ? "#00ff00" : "#ff0000",
  transition: "all 0.2s ease",
  opacity:
    connectionCreation?.connectionState.value.isCreating ||
    isBarHovered.value ||
    startPointHover.value ||
    endPointHover.value
      ? 1
      : 0,
  zIndex: 1000
}))

// Style for start connection point
const startPointStyle = computed(() => ({
  ...connectionPointStyle.value,
  left: 0,
  top: "50%",
  transform: "translate(-50%, -50%)"
}))

// Style for end connection point
const endPointStyle = computed(() => ({
  ...connectionPointStyle.value,
  right: 0,
  top: "50%",
  transform: "translate(50%, -50%)"
}))

// Check if bar can be connection target
const canBeTarget = computed(() => {
  if (!connectionCreation?.connectionState.value.isCreating) return false
  return connectionCreation.canBeConnectionTarget.value(props.bar)
})

// -----------------------------
// 6. MOUSE AND TOUCH SUPPORT
// -----------------------------

// Function to create a callback that will be called on first mouse movement
const firstMousemoveCallback = (e: MouseEvent) => {
  if (barConfig.value.bundle != null) {
    initDragOfBundle(bar.value, e)
  } else {
    initDragOfBar(bar.value, e)
  }
  isDragging.value = true
}

// Prepare bar for dragging
const prepareForDrag = () => {
  setDragLimitsOfGanttBar(bar.value)
  if (barConfig.value.immobile) {
    return
  }

  window.addEventListener("mousemove", firstMousemoveCallback, {
    once: true
  })
  window.addEventListener(
    "mouseup",
    () => {
      window.removeEventListener("mousemove", firstMousemoveCallback)
      isDragging.value = false
    },
    { once: true }
  )
}

// Handle mouse events
const onMouseEvent = (e: MouseEvent) => {
  e.preventDefault()
  if (e.type === "mousedown") {
    prepareForDrag()
  }
  const barContainer = barContainerEl?.value?.getBoundingClientRect()
  if (!barContainer) {
    return
  }
  const datetime = mapPositionToTime(e.clientX - barContainer.left)
  emitBarEvent(e, bar.value, datetime)
}

// Get bar container element
const barContainerEl = inject(BAR_CONTAINER_KEY)

// -----------------------------
// 7. TOUCH EVENT HANDLING
// -----------------------------

// Configure touch event handling
const { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } = useTouchEvents(
  (_draggedBar, e) => {
    firstMousemoveCallback(e)
    isDragging.value = true
  }
)

const onTouchEvent = (e: TouchEvent) => {
  if (bar.value.ganttBarConfig.immobile) return

  let mouseEvent: MouseEvent | undefined

  switch (e.type) {
    case "touchstart":
      mouseEvent = handleTouchStart(e, bar.value)!
      break
    case "touchmove":
      mouseEvent = handleTouchMove(e)!
      break
    case "touchend":
      mouseEvent = handleTouchEnd(e)!
      break
    case "touchcancel":
      mouseEvent = handleTouchCancel(e)!
      break
  }

  if (mouseEvent) {
    onMouseEvent(mouseEvent)
  }
}

// -----------------------------
// 8. PROGRESS BAR HANDLING
// -----------------------------

const isProgressDragging = ref(false)
const progressDragStart = ref(0)
const initialProgress = ref(0)

// Start progress bar dragging
const handleProgressDragStart = (e: MouseEvent) => {
  if (!props.bar.ganttBarConfig.progressResizable && !defaultProgressResizable.value) return

  e.stopPropagation()
  isProgressDragging.value = true
  progressDragStart.value = e.clientX
  initialProgress.value = props.bar.ganttBarConfig.progress ?? 0

  window.addEventListener("mousemove", handleProgressDrag)
  window.addEventListener("mouseup", handleProgressDragEnd)

  emitBarEvent(
    {
      ...e,
      type: "progress-drag-start"
    },
    props.bar
  )
}

const { findBarElement } = useBarSelector()

// Handle progress bar dragging
const handleProgressDrag = (e: MouseEvent) => {
  if (!isProgressDragging.value) return

  const barElement = findBarElement(ganttId, props.bar.ganttBarConfig.id)
  if (!barElement) return

  const rect = barElement.getBoundingClientRect()
  const deltaX = e.clientX - progressDragStart.value
  const percentageDelta = (deltaX / rect.width) * 100

  const newProgress = Math.min(Math.max(initialProgress.value + percentageDelta, 0), 100)
  bar.value.ganttBarConfig.progress = Math.round(newProgress)

  emitBarEvent(
    {
      ...e,
      type: "progress-change"
    },
    props.bar
  )
}

// End progress bar dragging
const handleProgressDragEnd = (e: MouseEvent) => {
  if (!isProgressDragging.value) return

  isProgressDragging.value = false
  window.removeEventListener("mousemove", handleProgressDrag)
  window.removeEventListener("mouseup", handleProgressDragEnd)

  emitBarEvent(
    {
      ...e,
      type: "progress-drag-end"
    },
    props.bar
  )
}

// -----------------------------
// 9. CONNECTION POINT HANDLING
// -----------------------------

const startPointHover = ref(false)
const endPointHover = ref(false)
const isBarHovered = ref(false)

// Handle connection point mouse enter
const handleConnectionPointMouseEnter = (point: ConnectionPoint) => {
  if (!enableConnectionCreation.value) return

  if (point === "start") {
    startPointHover.value = true
  } else {
    endPointHover.value = true
  }

  connectionCreation?.handleConnectionPointHover(props.bar.ganttBarConfig.id, point, true)
}

// Handle connection point mouse leave
const handleConnectionPointMouseLeave = (point: ConnectionPoint) => {
  if (!enableConnectionCreation.value) return

  if (point === "start") {
    startPointHover.value = false
  } else {
    endPointHover.value = false
  }

  connectionCreation?.handleConnectionPointHover(props.bar.ganttBarConfig.id, point, false)
}

// Handle connection point mouse down to start connection creation
const handleConnectionPointMouseDown = (e: MouseEvent, point: ConnectionPoint) => {
  if (!enableConnectionCreation.value) return

  e.stopPropagation()
  connectionCreation?.startConnectionCreation(props.bar, point, e)
}

// Handle connection point mouse up to complete connection
const handleConnectionDrop = (e: MouseEvent, point: ConnectionPoint) => {
  if (!enableConnectionCreation.value) return
  e.stopPropagation()
  connectionCreation?.completeConnection(props.bar, point, e)
}

// -----------------------------
// 10. BAR HOVER HANDLING
// -----------------------------

// Handle bar mouse enter
const handleBarMouseEnter = (e: MouseEvent) => {
  isBarHovered.value = true
  onMouseEvent(e)
}

// Handle bar mouse leave
const handleBarMouseLeave = (e: MouseEvent) => {
  isBarHovered.value = false
  onMouseEvent(e)
}

// -----------------------------
// 11. LABEL EDITING HANDLING
// -----------------------------

// Start label editing
const startEditing = (e: MouseEvent) => {
  if (!barLabelEditable.value || isGroupBar.value) return

  e.stopPropagation()

  bar.value.ganttBarConfig._previousLabel = barConfig.value.label || ""

  isEditing.value = true
  editedLabel.value = barConfig.value.label || ""

  setTimeout(() => {
    if (labelInput.value) {
      labelInput.value.focus()
      labelInput.value.select()
    }
  }, 0)
}

// Save edited label
const saveLabel = () => {
  if (!isEditing.value) return

  bar.value.ganttBarConfig.label = editedLabel.value

  emitBarEvent(
    {
      type: "label-edit",
      preventDefault: () => {},
      stopPropagation: () => {}
    } as unknown as MouseEvent,
    bar.value
  )

  isEditing.value = false
}

// Cancel label editing
const cancelEditing = () => {
  isEditing.value = false
}

// Handle keyboard input during label editing
const handleLabelKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    saveLabel()
  } else if (e.key === "Escape") {
    cancelEditing()
  }
}

// Handle input blur
const handleInputBlur = () => {
  saveLabel()
}

// -----------------------------
// 12. UTILITY FUNCTIONS
// -----------------------------

// Calculate darker color for progress bar
const getDarkerColor = (color: string) => {
  const rgb = color.startsWith("#") ? hexToRgb(color) : parseRgb(color)

  return `rgba(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)}, ${rgb.a})`
}

// Convert hex color to RGB format
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
        a: 1
      }
    : { r: 0, g: 0, b: 0, a: 1 }
}

// Parse RGB color string to object
const parseRgb = (color: string) => {
  const matches = color.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
  if (matches) {
    return {
      r: parseInt(matches[1]!),
      g: parseInt(matches[2]!),
      b: parseInt(matches[3]!),
      a: matches[4] ? parseFloat(matches[4]) : 1
    }
  }
  return { r: 0, g: 0, b: 0, a: 1 }
}

// Create SVG path for group bars
const getGroupBarPath = (width: number, height: number) => {
  const mainBarHeight = height * 0.5

  return `
    M 0 0
    L 0 ${height}
    L ${15} ${mainBarHeight}
    L ${width - 15} ${mainBarHeight}
    L ${width} ${height}
    L ${width} 0
    L 0 0
  `
}

// -----------------------------
// 13. KEYBOARD SUPPORT
// -----------------------------

// Configure keyboard control support
const { onBarKeyDown } = useBarKeyboardControl(bar.value, config, emitBarEvent)

// -----------------------------
// 14. LIFECYCLE HOOKS
// -----------------------------

onMounted(() => {
  xStart.value = mapTimeToPosition(bar.value[barStart.value])
  xEnd.value = mapTimeToPosition(bar.value[barEnd.value])

  // Calculate planned bar positions if they exist
  if (hasPlannedDates.value) {
    xStartPlanned.value = mapTimeToPosition(bar.value.start_planned! as string)
    xEndPlanned.value = mapTimeToPosition(bar.value.end_planned! as string)
  }

  watch(
    [() => bar.value, width, chartStart, chartEnd, chartSize.width],
    () => {
      const newXStart = mapTimeToPosition(bar.value[barStart.value])
      const newXEnd = mapTimeToPosition(bar.value[barEnd.value])

      xStart.value = newXStart
      xEnd.value = newXEnd

      // Update planned bar positions if they exist
      if (hasPlannedDates.value) {
        xStartPlanned.value = mapTimeToPosition(bar.value.start_planned! as string)
        xEndPlanned.value = mapTimeToPosition(bar.value.end_planned! as string)
      }
    },
    { deep: true, immediate: true }
  )
})
</script>

<template>
  <!-- Planned Bar (rendered as independent element) -->
  <div
    v-if="hasPlannedDates && !isGroupBar"
    :id="`${barConfig.id}-planned`"
    class="g-gantt-planned-bar"
    :style="plannedBarStyle"
  />

  <!-- Main Bar -->
  <div
    :id="barConfig.id"
    :class="['g-gantt-bar', barConfig.class || '']"
    :style="{
      ...barConfig.style,
      position: 'absolute',
      top: `${rowHeight * 0.15}px`,
      left: `${xStart}px`,
      width: `${xEnd - xStart}px`,
      height: `${rowHeight * 0.7}px`,
      zIndex: isDragging ? 3 : 2,
      cursor: bar.ganttBarConfig.immobile ? '' : 'grab'
    }"
    @mousedown="onMouseEvent"
    @click="onMouseEvent"
    @mouseenter="handleBarMouseEnter"
    @mouseleave="handleBarMouseLeave"
    @contextmenu="onMouseEvent"
    @touchstart="onTouchEvent"
    @touchmove="onTouchEvent"
    @touchend="onTouchEvent"
    @touchcancel="onTouchEvent"
    @keydown="onBarKeyDown"
    @dblclick="startEditing"
    role="listitem"
    :aria-label="`Activity ${barConfig.label}`"
    :aria-grabbed="isDragging"
    tabindex="0"
    :aria-describedby="`tooltip-${barConfig.id}`"
  >
    <!-- Connection Points -->
    <template v-if="enableConnectionCreation">
      <div
        class="connection-point start"
        :style="[startPointStyle, { position: 'absolute' }]"
        @mouseenter="handleConnectionPointMouseEnter('start')"
        @mouseleave="handleConnectionPointMouseLeave('start')"
        @mousedown="handleConnectionPointMouseDown($event, 'start')"
        @mouseup="handleConnectionDrop($event, 'start')"
      />
      <div
        class="connection-point end"
        :style="[endPointStyle, { position: 'absolute' }]"
        @mouseenter="handleConnectionPointMouseEnter('end')"
        @mouseleave="handleConnectionPointMouseLeave('end')"
        @mousedown="handleConnectionPointMouseDown($event, 'end')"
        @mouseup="handleConnectionDrop($event, 'end')"
      />
    </template>
    <!-- Progress Bar -->
    <div
      v-if="barConfig.progress !== undefined"
      class="g-gantt-progress-bar"
      :style="progressStyle"
    >
      <span class="progress-text" v-if="showProgress">{{ Math.round(barConfig.progress) }}%</span>
      <div
        v-if="barConfig.progressResizable || defaultProgressResizable"
        class="g-gantt-progress-handle"
        :style="{ right: bar.ganttBarConfig.progress === 0 ? 0 : '-4px' }"
        @mousedown="handleProgressDragStart"
      />
    </div>
    <!-- SVG for Group Bars -->
    <template v-if="isGroupBar">
      <slot name="group-bar" :width="xEnd - xStart" :height="rowHeight * 0.7" :bar="bar">
        <svg class="group-bar-decoration" :width="xEnd - xStart" :height="rowHeight * 0.7">
          <path
            :d="getGroupBarPath(xEnd - xStart, rowHeight * 0.65)"
            :fill="config.colors.value.barContainer"
          />
        </svg>
      </slot>
      <!-- Group Bar Label -->
      <div v-if="showGroupLabel" class="g-gantt-group-bar-label">
        <slot name="group-bar-label" :bar="bar">
          <div
            :style="{
              backgroundColor: config.colors.value.barContainer,
              padding: '0px 6px',
              borderRadius: '4px',
              marginTop: '-10px'
            }"
          >
            {{ barConfig.label || "" }}
          </div>
          <div v-if="barConfig.html" v-html="barConfig.html" />
        </slot>
      </div>
    </template>
    <!-- Bar Label -->
    <div v-else class="g-gantt-bar-label">
      <slot name="bar-label" :bar="bar">
        <div v-if="!isGroupBar && showLabel">
          <div v-if="isEditing && barLabelEditable" class="g-gantt-bar-label-edit">
            <input
              ref="labelInput"
              v-model="editedLabel"
              @keydown="handleLabelKeydown"
              @blur="handleInputBlur"
              class="g-gantt-bar-label-input"
            />
          </div>
          <div v-else>
            {{ barConfig.label || "" }}
          </div>
        </div>
        <div v-if="barConfig.html" v-html="barConfig.html" />
      </slot>
    </div>
    <!-- Bar Label -->
    <template v-if="barConfig.hasHandles">
      <div class="g-gantt-bar-handle-left" />
      <div class="g-gantt-bar-handle-right" />
    </template>
  </div>
</template>

<style>
.g-gantt-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  background: cadetblue;
  overflow: visible;
  position: relative;
}

.g-gantt-bar-label {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0 14px 0 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
  pointer-events: none;
}

.g-gantt-bar-label > * {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.g-gantt-bar-handle-left,
.g-gantt-bar-handle-right {
  position: absolute;
  width: 10px;
  height: 100%;
  background: white;
  opacity: 0.7;
  border-radius: 0px;
  cursor: ew-resize;
  top: 0;
}

.g-gantt-bar-handle-left {
  left: 0;
}

.g-gantt-bar-handle-right {
  right: 0;
}

.g-gantt-bar-label img {
  pointer-events: none;
}

.g-gantt-bar-label-edit {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: all;
}

.g-gantt-bar-label-input {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  width: 100%;
  height: 100%;
  background: white;
  color: black;
  outline: none;
  font: inherit;
  padding: 2px;
  text-align: center;
}

.is-group-bar {
  background: transparent !important;
}

.group-bar-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.g-gantt-group-bar-label {
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0 14px 0 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3;
  pointer-events: none;
  color: inherit;
}

.g-gantt-group-bar-label > * {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.g-gantt-progress-bar {
  position: absolute;
  pointer-events: none;
  overflow: hidden;
  min-width: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /*padding-right: 10px;*/
  color: #fff;
  font-size: 0.8em;
  font-weight: 500;
  z-index: 1;
}

.progress-text {
  padding-right: 10px;
}

.g-gantt-progress-handle {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  cursor: ew-resize;
  pointer-events: all;
  transition: background-color 0.2s ease;
  z-index: 3;
}

.g-gantt-progress-handle:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.g-gantt-progress-handle:active {
  background-color: rgba(0, 0, 0, 0.7);
}

.connection-point {
  z-index: 10;
}

.connection-point:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.connection-point.end:hover {
  transform: translate(50%, -50%) scale(1.2);
}

.g-gantt-planned-bar {
  pointer-events: none;
}
</style>
