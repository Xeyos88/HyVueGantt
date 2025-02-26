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

// Provider
import provideConfig from "../provider/provideConfig"
import { BAR_CONTAINER_KEY } from "../provider/symbols"

// Components
import GGanttBar from "./GGanttBar.vue"

// Types
import type { GanttBarConnection, GanttBarObject } from "../types"
import type { UseRowsReturn } from "../composables/useRows"

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
}>()

/**
 * Interface for slot data structure to ensure type safety
 */
interface SlotData {
  bar?: GanttBarObject
  label?: string
  [key: string]: GanttBarObject | string | undefined
}

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------

// Row Management
const rowManager = inject<UseRowsReturn>("useRows")!

// Configuration
const { rowHeight, colors, labelColumnTitle, rowClass } = provideConfig()
const { highlightOnHover } = toRefs(props)

// Bar Container Reference
const barContainer: Ref<HTMLElement | null> = ref(null)

// UI State
const isHovering = ref(false)

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

// -----------------------------
// 6. MAPPING AND UTILITY FUNCTIONS
// -----------------------------

// Time position mapping
const { mapPositionToTime } = useTimePositionMapping()

/**
 * Checks if a string is blank (empty or only whitespace)
 * @param str - String to check
 * @returns Boolean indicating if string is blank
 */
const isBlank = (str: string) => {
  return !str || /^\s*$/.test(str)
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
      <transition-group name="bar-transition" tag="div">
        <!-- Render bars for this row -->
        <g-gantt-bar
          v-for="bar in bars"
          :key="bar.ganttBarConfig.id"
          :bar="bar"
          :class="{ 'g-gantt-group-bar': isGroup }"
        >
          <!-- Pass bar label slot to children -->
          <slot name="bar-label" :bar="bar" v-if="!isGroup" />
        </g-gantt-bar>
      </transition-group>
    </div>
  </div>
  <!-- Child rows (rendered when group is expanded) -->
  <div v-if="isGroup && isExpanded" class="g-gantt-row-children">
    <g-gantt-row
      v-for="child in visibleChildRows"
      :key="child.id || child.label"
      v-bind="child"
      :highlightOnHover="highlightOnHover"
    >
      <!-- Forward all slots to child rows -->
      <template v-for="(_, name) in $slots" :key="name" v-slot:[name]="slotProps: SlotData">
        <slot :name="name" v-bind="slotProps" />
      </template>
    </g-gantt-row>
  </div>
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
</style>
