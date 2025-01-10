<script setup lang="ts">
import { ref, type Ref, toRefs, computed, provide, inject, type CSSProperties } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faChevronRight, faChevronDown } from "@fortawesome/free-solid-svg-icons"
import useTimePositionMapping from "../composables/useTimePositionMapping"
import provideConfig from "../provider/provideConfig"
import type { GanttBarObject } from "../types"
import GGanttBar from "./GGanttBar.vue"
import { BAR_CONTAINER_KEY } from "../provider/symbols"
import type { UseRowsReturn } from "../composables/useRows"

interface SlotData {
  bar?: GanttBarObject
  label?: string
  [key: string]: any
}

const props = defineProps<{
  label: string
  bars: GanttBarObject[]
  highlightOnHover?: boolean
  id?: string | number
  children?: { id: string | number; label: string; bars: GanttBarObject[] }[]
}>()

const emit = defineEmits<{
  (e: "drop", value: { e: MouseEvent; datetime: string | Date }): void
}>()

const rowManager = inject<UseRowsReturn>("useRows")!
const { rowHeight, colors, labelColumnTitle, rowClass } = provideConfig()
const { highlightOnHover } = toRefs(props)
const isHovering = ref(false)

const isGroup = computed(() => Boolean(props.children?.length))

const isExpanded = computed(() => {
  if (!isGroup.value || !props.id) return false
  return rowManager.isGroupExpanded(props.id)
})

const rowStyle = computed(() => {
  const baseStyle: CSSProperties = {
    height: `${rowHeight.value}px`,
    background:
      highlightOnHover?.value && isHovering.value ? colors.value.hoverHighlight : undefined
  }

  if (isGroup.value) {
    return {
      ...baseStyle,
      background: colors.value.rowContainer
    }
  }

  return baseStyle
})

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

const { mapPositionToTime } = useTimePositionMapping()
const barContainer: Ref<HTMLElement | null> = ref(null)

provide(BAR_CONTAINER_KEY, barContainer)

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

const isBlank = (str: string) => {
  return !str || /^\s*$/.test(str)
}

const handleGroupToggle = (event: Event) => {
  event.stopPropagation()
  if (props.id) {
    rowManager.toggleGroupExpansion(props.id)
  }
}

const visibleChildRows = computed(() => {
  if (!isGroup.value || !isExpanded.value) return []
  return props.children || []
})
</script>

<template>
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
    <div
      v-if="!isBlank(label) && !labelColumnTitle"
      class="g-gantt-row-label"
      :class="{ 'g-gantt-row-group-label': isGroup }"
      :style="{ background: colors.primary, color: colors.text }"
      @click="isGroup ? handleGroupToggle($event) : undefined"
    >
      <button v-if="isGroup" class="group-toggle-button" @click="handleGroupToggle($event)">
        <FontAwesomeIcon :icon="isExpanded ? faChevronDown : faChevronRight" class="group-icon" />
      </button>
      <slot name="label">
        {{ label }}
      </slot>
    </div>
    <div ref="barContainer" class="g-gantt-row-bars-container" v-bind="$attrs">
      <transition-group name="bar-transition" tag="div">
        <g-gantt-bar
          v-for="bar in bars"
          :key="bar.ganttBarConfig.id"
          :bar="bar"
          :class="{ 'g-gantt-group-bar': isGroup }"
        >
          <slot name="bar-label" :bar="bar" />
        </g-gantt-bar>
      </transition-group>
    </div>
  </div>
  <div v-if="isGroup && isExpanded" class="g-gantt-row-children">
    <g-gantt-row v-for="child in visibleChildRows" :key="child.id || child.label" v-bind="child">
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

.g-gantt-row > .g-gantt-row-bars-container {
  position: relative;
  border-top: 1px solid #eaeaea;
  width: 100%;
  border-bottom: 1px solid #eaeaea;
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

.g-gantt-group-bar {
  opacity: 0.7;
  pointer-events: none;
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
