<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { ref, type Ref, toRefs, computed, provide, inject, type StyleValue } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faChevronRight, faChevronDown } from "@fortawesome/free-solid-svg-icons"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Composables
import useTimePositionMapping from "../composables/useTimePositionMapping"
import useDayjsHelper from "../composables/useDayjsHelper"

// Provider
import provideConfig from "../provider/provideConfig"
import { BAR_CONTAINER_KEY, INTERNAL_PRECISION_KEY } from "../provider/symbols"

// Components
import GGanttBar from "./GGanttBar.vue"
import GGanttRow from "./GGanttRow.vue"

// Types
import type { GanttBarConnection, GanttBarObject } from "../types"
import type { UseRowsReturn } from "../composables/useRows"
import type { RangeSelectionEvent } from "../types"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  label: string
  bars: GanttBarObject[]
  highlightOnHover?: boolean
  id: string | number
  children?: {
    id: string | number
    label: string
    bars: GanttBarObject[]
    connections?: GanttBarConnection[]
  }[]
  connections?: GanttBarConnection[]
}>()

// Events that can be emitted by this component
const emit = defineEmits<{
  (e: "drop", value: { e: MouseEvent; datetime: string | Date }): void
  (e: "range-selection", value: RangeSelectionEvent): void
}>()



// -----------------------------
// 4. INTERNAL STATE
// -----------------------------

// Row Management
const rowManager = inject<UseRowsReturn>("useRows")!

// Configuration
const { rowHeight, colors, labelColumnTitle, rowClass, dateFormat, tick } = provideConfig()
const { highlightOnHover } = toRefs(props)

const internalPrecision = inject(INTERNAL_PRECISION_KEY)!

// Time Position Mapping
const { mapPositionToTime, mapTimeToPosition } = useTimePositionMapping()
const { format, toDayjs } = useDayjsHelper()

// Bar Container Reference
const barContainer: Ref<HTMLElement | null> = ref(null)

// UI State
const isHovering = ref(false)

// Selection State
const isSelecting = ref(false)
const selectionStartX = ref(0)
const selectionEndX = ref(0)
const selectionVisible = ref(false)

// Tooltip State
const showRangeTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const tooltipStartDate = ref<string | Date>("")
const tooltipEndDate = ref<string | Date>("")

// -----------------------------
// 5. COMPUTED PROPERTIES
// -----------------------------

/**
 * Determines if this row is a group row based on the presence of children
 */
const isGroup = computed(() => Boolean(props.children?.length))

/**
 * Determines if a group row is expanded
 * Returns false for non-group rows or if row ID is not defined
 */
const isExpanded = computed(() => {
  if (!isGroup.value || !props.id) return false
  return rowManager.isGroupExpanded(props.id)
})

/**
 * Computed style for the row based on row type, height, and hover state
 */
const rowStyle = computed(() => {
  const baseStyle: StyleValue = {
    height: `${rowHeight.value}px`,
    borderBottom: `1px solid ${colors.value.gridAndBorder}`,
    background:
      highlightOnHover?.value && isHovering.value ? colors.value.hoverHighlight : undefined
  }

  if (isGroup.value) {
    return {
      ...baseStyle,
      background:
        highlightOnHover?.value && isHovering.value ? colors.value.hoverHighlight : undefined
    }
  }

  return baseStyle
})

/**
 * Computed CSS classes for the row
 * Applies custom row classes from configuration if available
 */
const rowClasses = computed(() => {
  const classes = ["g-gantt-row"]
  if (rowClass.value && props) {
    classes.push(rowClass.value(props))
  }
  if (isGroup.value) {
    classes.push("g-gantt-row-group")
  }
  return classes
})

/**
 * Computes visible child rows based on expansion state
 * Returns empty array if row is not a group or is not expanded
 */
const visibleChildRows = computed(() => {
  if (!isGroup.value || !isExpanded.value) return []
  return props.children || []
})

const selectionStyle = computed(() => {
  if (!selectionVisible.value) return { display: "none" }

  const left = Math.min(selectionStartX.value, selectionEndX.value)
  const width = Math.abs(selectionEndX.value - selectionStartX.value)

  return {
    position: "absolute" as const,
    left: `${left}px`,
    width: `${width}px`,
    height: `${rowHeight.value - 4}px`,
    background: colors.value.rangeHighlight,
    opacity: 0.6,
    pointerEvents: "none" as const,
    zIndex: 1,
    margin: "auto 0",
    top: "1px"
  }
})

/**
 * Checks if tick-based snapping is enabled
 */
const isTickEnabled = computed(() => tick.value && tick.value > 0)

// -----------------------------
// 6. MAPPING AND UTILITY FUNCTIONS
// -----------------------------

/**
 * Checks if a string is blank (empty or only whitespace)
 * @param str - String to check
 * @returns Boolean indicating if string is blank
 */
const isBlank = (str: string) => {
  return !str || /^\s*$/.test(str)
}

/**
 * Returns the unit of time for the current precision level
 * Used for snapping and tooltip display
 */
const getTickUnit = (): string => {
  switch (internalPrecision.value) {
    case "hour":
      return "minute"
    case "day":
      return "hour"
    case "week":
      return "day"
    case "month":
      return "week"
    default:
      return "minute"
  }
}

/**
 * Snaps a position to the nearest tick based on the current precision
 * @param position - Current position in pixels
 * @param startPosition - Starting position for snapping
 * @returns Snapped position in pixels
 */
const snapToTick = (position: number, startPosition: number): number => {
  if (!isTickEnabled.value) return position

  const startDateTime = mapPositionToTime(startPosition)
  const currentDateTime = mapPositionToTime(position)

  const startTime = toDayjs(startDateTime)
  const currentTime = toDayjs(currentDateTime)

  let duration: number
  let snapUnit: "minute" | "hour" | "day" = "minute"
  let snapValue = tick.value

  switch (internalPrecision.value) {
    case "hour":
      duration = currentTime.diff(startTime, "minute")
      snapUnit = "minute"
      snapValue = tick.value
      break
    case "day":
      duration = currentTime.diff(startTime, "hour")
      snapUnit = "hour"
      snapValue = tick.value
      break
    case "week":
      duration = currentTime.diff(startTime, "day")
      snapUnit = "day"
      snapValue = tick.value
      break
    case "month":
      duration = currentTime.diff(startTime, "day")
      snapUnit = "day"
      snapValue = tick.value * 7
      break
    default:
      duration = currentTime.diff(startTime, "minute")
      snapUnit = "minute"
      snapValue = tick.value
  }

  const snappedDuration = Math.round(Math.abs(duration) / snapValue) * snapValue

  const snappedTime = startTime.add(snappedDuration, snapUnit)
  return mapTimeToPosition(format(snappedTime, dateFormat.value) as string)
}

const updateTooltipPosition = () => {
  if (!barContainer.value) return

  const container = barContainer.value.getBoundingClientRect()

  const centerX = container.left + (selectionStartX.value + selectionEndX.value) / 2

  tooltipPosition.value = {
    x: centerX,
    y: container.top - 10
  }

  tooltipStartDate.value = mapPositionToTime(Math.min(selectionStartX.value, selectionEndX.value))
  tooltipEndDate.value = mapPositionToTime(Math.max(selectionStartX.value, selectionEndX.value))
}

// -----------------------------
// 7. EVENT HANDLERS
// -----------------------------

/**
 * Handles drop events on the row
 * Maps the drop position to a timestamp and emits the drop event
 * @param e - Mouse event from drop
 */
const onDrop = (e: MouseEvent) => {
  if (isGroup.value) return

  const container = barContainer.value?.getBoundingClientRect()
  if (!container) {
    console.error("Hyper Vue Gantt: failed to find bar container element for row.")
    return
  }
  const xPos = e.clientX - container.left
  const datetime = mapPositionToTime(xPos)
  emit("drop", { e, datetime })
}

/**
 * Handles group expansion toggling
 * @param event - Mouse event
 */
const handleGroupToggle = (event: Event) => {
  event.stopPropagation()
  if (props.id) {
    rowManager.toggleGroupExpansion(props.id)
  }
}

/**
 * Handles mouse down to start selection
 * @param e - Mouse event
 */
const handleSelectionStart = (e: MouseEvent) => {
  if (isGroup.value) return

  const target = e.target as HTMLElement
  if (target.closest(".g-gantt-bar")) return

  const container = barContainer.value?.getBoundingClientRect()
  if (!container) return

  const xPos = e.clientX - container.left

  isSelecting.value = true
  selectionStartX.value = xPos
  selectionEndX.value = xPos
  selectionVisible.value = false

  showRangeTooltip.value = true
  updateTooltipPosition()

  e.preventDefault()

  document.addEventListener("mousemove", handleSelectionMove)
  document.addEventListener("mouseup", handleSelectionEnd)
}

/**
 * Handles mouse move during selection
 * @param e - Mouse event
 */
const handleSelectionMove = (e: MouseEvent) => {
  if (!isSelecting.value || !barContainer.value) return

  const container = barContainer.value.getBoundingClientRect()
  let xPos = Math.max(0, e.clientX - container.left)

  if (isTickEnabled.value) {
    xPos = snapToTick(xPos, selectionStartX.value)
  }

  selectionEndX.value = xPos
  selectionVisible.value = Math.abs(selectionEndX.value - selectionStartX.value) > 5
  if (selectionVisible.value) {
    updateTooltipPosition()
  }
}

/**
 * Handles mouse up to complete selection
 * @param e - Mouse event
 */
const handleSelectionEnd = (e: MouseEvent) => {
  document.removeEventListener("mousemove", handleSelectionMove)
  document.removeEventListener("mouseup", handleSelectionEnd)

  if (!isSelecting.value || !selectionVisible.value) {
    resetSelection()
    return
  }

  const startTime = mapPositionToTime(Math.min(selectionStartX.value, selectionEndX.value))
  const endTime = mapPositionToTime(Math.max(selectionStartX.value, selectionEndX.value))

  const rowData = {
    id: props.id,
    label: props.label,
    bars: props.bars,
    children: props.children,
    connections: props.connections
  }

  emit("range-selection", {
    row: rowData,
    startDate: startTime,
    endDate: endTime,
    e
  })

  resetSelection()
}

/**
 * Resets selection state
 */
const resetSelection = () => {
  isSelecting.value = false
  selectionVisible.value = false
  selectionStartX.value = 0
  selectionEndX.value = 0
  showRangeTooltip.value = false
}

// -----------------------------
// 8. PROVIDE/INJECT SETUP
// -----------------------------

// Provide bar container reference to child components
provide(BAR_CONTAINER_KEY, barContainer)
</script>

<template>
  <!-- Main row component -->
  <div
    :class="rowClasses"
    :style="rowStyle"
    @dragover.prevent="isHovering = true"
    @dragleave="isHovering = false"
    @drop="onDrop($event)"
    @mouseover="isHovering = true"
    @mouseleave="isHovering = false"
    role="list"
    @mousedown="handleSelectionStart"
  >
    <!-- Row label (shown only when labelColumnTitle is not set) -->
    <div
      v-if="!isBlank(label) && !labelColumnTitle"
      class="g-gantt-row-label"
      :class="{ 'g-gantt-row-group-label': isGroup }"
      :style="{ background: colors.primary, color: colors.text }"
      @click="isGroup ? handleGroupToggle($event) : undefined"
    >
      <!-- Expand/collapse button for groups -->
      <button v-if="isGroup" class="group-toggle-button" @click="handleGroupToggle($event)">
        <FontAwesomeIcon :icon="isExpanded ? faChevronDown : faChevronRight" class="group-icon" />
      </button>
      <!-- Row label content -->
      <slot name="label">
        {{ label }}
      </slot>
    </div>
    <!-- Bar container -->
    <div ref="barContainer" class="g-gantt-row-bars-container" v-bind="$attrs">
      <div v-if="selectionVisible" class="g-gantt-range-selection" :style="selectionStyle" />
      <transition-group name="bar-transition" tag="div">
        <!-- Render bars for this row -->
        <g-gantt-bar
          v-for="bar in bars"
          :key="bar.ganttBarConfig.id"
          :bar="bar"
          :class="{ 'g-gantt-group-bar': isGroup }"
        >
          <!-- Pass bar label slot to children -->
          <template v-for="(_, name) in $slots" :key="name" v-slot:[name]="slotProps">
            <slot :name="name" v-bind="slotProps" />
          </template>
        </g-gantt-bar>
      </transition-group>
    </div>
  </div>
  <!-- Child rows (rendered when group is expanded) -->
  <div v-if="isGroup && isExpanded" class="g-gantt-row-children">
    <component
      :is="(GGanttRow as any)"
      v-for="child in visibleChildRows"
      :key="child.id || child.label"
      v-bind="child"
      :highlightOnHover="highlightOnHover"
      @range-selection="(event: RangeSelectionEvent) => $emit('range-selection', event)"
    >
      <!-- Forward all slots to child rows -->
      <template v-for="(_, name) in $slots" :key="name" v-slot:[name]="slotProps">
        <slot :name="name" v-bind="slotProps" />
      </template>
    </component>
  </div>
  <!-- AGGIUNTO: Start Tooltip (fixed at selection start) -->
  <teleport to="body">
    <transition name="g-fade" mode="out-in">
      <div
        v-if="showRangeTooltip && selectionVisible"
        class="g-gantt-range-tooltip g-gantt-range-tooltip-start"
        :style="{
          top: `${tooltipPosition.y}px`,
          left: `${tooltipPosition.x}px`,
          background: colors.primary,
          color: colors.text
        }"
      >
        <slot
          name="range-selection-tooltip"
          :start-date="tooltipStartDate"
          :end-date="tooltipEndDate"
          :formatted-start-date="format(tooltipStartDate, dateFormat)"
          :formatted-end-date="format(tooltipEndDate, dateFormat)"
          :tick="tick"
          :tick-enabled="isTickEnabled"
          :tick-unit="getTickUnit()"
          :internal-precision="internalPrecision"
        >
          <div class="g-gantt-range-tooltip-date">
            {{ format(tooltipStartDate, dateFormat) }} - {{ format(tooltipEndDate, dateFormat) }}
          </div>
        </slot>
      </div>
    </transition>
  </teleport>
</template>

<style>
.g-gantt-row {
  width: 100%;
  transition: background 0.4s;
  position: relative;
}

/*.g-gantt-row:last-child {
  border-bottom: 0px !important;
}*/

.g-gantt-row > .g-gantt-row-bars-container {
  position: relative;
  width: 100%;
}

.g-gantt-row-label {
  position: absolute;
  top: 0;
  left: 0px;
  padding: 0px 8px;
  display: flex;
  align-items: center;
  height: 60%;
  min-height: 20px;
  font-size: 0.8em;
  font-weight: bold;
  border-bottom-right-radius: 6px;
  background: #f2f2f2;
  z-index: 3;
  box-shadow: 0px 1px 4px 0px rgba(0, 0, 0, 0.6);
}

.g-gantt-row-group-label {
  font-weight: bold;
  background: #e0e0e0 !important;
}

.g-gantt-row-children {
  transition: max-height 0.3s ease-in-out;
}

.bar-transition-leave-active,
.bar-transition-enter-active {
  transition: all 0.2s;
}

.bar-transition-enter-from,
.bar-transition-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

.g-gantt-range-selection {
  border-radius: 2px;
  box-sizing: border-box;
}

.g-gantt-row-bars-container {
  cursor: crosshair;
}

.g-gantt-row-bars-container:has(.g-gantt-bar) {
  cursor: default;
}

.g-gantt-range-tooltip {
  position: fixed;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.6em;
  z-index: 1000;
  min-width: 120px;
  max-width: 240px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%) translateY(-100%);
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.g-gantt-range-tooltip-title {
  font-weight: bold;
  font-size: 0.9em;
  margin-bottom: 4px;
  opacity: 0.9;
}

.g-gantt-range-tooltip-date {
  font-size: 1em;
  font-weight: 500;
  line-height: 1.2;
}

/* AGGIUNTO: Fade transition for tooltips */
.g-fade-enter-active,
.g-fade-leave-active {
  transition: opacity 0.2s ease;
}

.g-fade-enter-from,
.g-fade-leave-to {
  opacity: 0;
}

/* Group toggle button styling */
.group-toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 8px;
  padding: 2px;
  border-radius: 2px;
  transition: background-color 0.2s;
}

.group-toggle-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.group-icon {
  font-size: 0.8em;
}
</style>
