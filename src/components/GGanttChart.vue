<script setup lang="ts">
// External Imports
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faAnglesLeft,
  faAngleLeft,
  faAngleRight,
  faAnglesRight,
  faAngleUp,
  faAngleDown,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus
} from "@fortawesome/free-solid-svg-icons"
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  toRefs,
  toRef,
  useSlots,
  watch
} from "vue"
import { useElementSize } from "@vueuse/core"
import dayjs from "dayjs"

// Internal Imports - Components
import GGanttGrid from "./GGanttGrid.vue"
import GGanttLabelColumn from "./GGanttLabelColumn.vue"
import GGanttTimeaxis from "./GGanttTimeaxis.vue"
import GGanttBarTooltip from "./GGanttBarTooltip.vue"
import GGanttCurrentTime from "./GGanttCurrentTime.vue"
import GGanttConnector from "./GGanttConnector.vue"
import GGanttRow from "./GGanttRow.vue"

// Internal Imports - Composables
import { useConnections } from "../composables/useConnections"
import { useTooltip } from "../composables/useTooltip"
import { useChartNavigation } from "../composables/useChartNavigation"
import { useKeyboardNavigation } from "../composables/useKeyboardNavigation"
import { useRows } from "../composables/useRows"

// Types and Constants
import { colorSchemes, type ColorScheme, type ColorSchemeKey } from "../color-schemes"
import { DEFAULT_DATE_FORMAT } from "../composables/useDayjsHelper"
import { BOOLEAN_KEY, CONFIG_KEY, EMIT_BAR_EVENT_KEY } from "../provider/symbols"
import type { GanttBarObject, GGanttChartProps, SortDirection } from "../types"
import type { CSSProperties } from "vue"

// Props & Emits Definition
const props = withDefaults(defineProps<GGanttChartProps>(), {
  currentTimeLabel: "",
  dateFormat: DEFAULT_DATE_FORMAT,
  precision: "day",
  width: "100%",
  hideTimeaxis: false,
  colorScheme: "default",
  grid: false,
  pushOnOverlap: false,
  pushOnConnect: false,
  noOverlap: false,
  rowHeight: 40,
  highlightedUnits: () => [],
  font: "inherit",
  labelColumnTitle: "",
  labelColumnWidth: 150,
  commands: true,
  enableMinutes: false,
  enableConnections: true,
  defaultConnectionType: "straight",
  defaultConnectionColor: "#ff0000",
  defaultConnectionPattern: "solid",
  defaultConnectionAnimated: false,
  defaultConnectionAnimationSpeed: "normal",
  maxRows: 0,
  initialSortDirection: "none",
  initialRows: () => [],
  multiColumnLabel: () => [],
  sortable: true,
  labelResizable: true
})

const id = ref(crypto.randomUUID())
const slots = useSlots()

const rowManager = useRows(
  slots,
  {
    barStart: toRef(props, "barStart"),
    barEnd: toRef(props, "barEnd"),
    multiColumnLabel: toRef(props, "multiColumnLabel")
  },
  props.initialRows ? toRef(props, "initialRows") : undefined
)
const rows = computed(() => rowManager.rows.value)

provide("useRows", rowManager)

// Based on props
const rowsContainerStyle = computed<CSSProperties>(() => {
  if (props.maxRows === 0) return {}

  return {
    "max-height": `${props.maxRows * props.rowHeight}px`,
    "overflow-y": "auto"
  }
})

watch([() => props.chartStart, () => props.chartEnd], () => {
  updateBarPositions()
})

// Events
const emit = defineEmits<{
  (e: "click-bar", value: { bar: GanttBarObject; e: MouseEvent; datetime?: string | Date }): void
  (
    e: "mousedown-bar",
    value: { bar: GanttBarObject; e: MouseEvent; datetime?: string | Date }
  ): void
  (e: "mouseup-bar", value: { bar: GanttBarObject; e: MouseEvent; datetime?: string | Date }): void
  (e: "dblclick-bar", value: { bar: GanttBarObject; e: MouseEvent; datetime?: string | Date }): void
  (e: "mouseenter-bar", value: { bar: GanttBarObject; e: MouseEvent }): void
  (e: "mouseleave-bar", value: { bar: GanttBarObject; e: MouseEvent }): void
  (e: "dragstart-bar", value: { bar: GanttBarObject; e: MouseEvent }): void
  (e: "drag-bar", value: { bar: GanttBarObject; e: MouseEvent }): void
  (
    e: "dragend-bar",
    value: {
      bar: GanttBarObject
      e: MouseEvent
      movedBars?: Map<GanttBarObject, { oldStart: string; oldEnd: string }>
    }
  ): void
  (
    e: "contextmenu-bar",
    value: { bar: GanttBarObject; e: MouseEvent; datetime?: string | Date }
  ): void
  (e: "sort", value: { direction: SortDirection }): void
}>()

// Computed Properties
const chartStartDayjs = computed(() => dayjs(props.chartStart, props.dateFormat as string, true))
const chartEndDayjs = computed(() => dayjs(props.chartEnd, props.dateFormat as string, true))

const diffDays = computed(() => chartEndDayjs.value.diff(chartStartDayjs.value, "day") + 1)
const diffHours = computed(() => chartEndDayjs.value.diff(chartStartDayjs.value, "hour"))

// Chart Elements Refs
const ganttChart = ref<HTMLElement | null>(null)
const chartSize = useElementSize(ganttChart)
const ganttWrapper = ref<HTMLElement | null>(null)
const timeaxisComponent = ref<InstanceType<typeof GGanttTimeaxis> | null>(null)
const ganttContainer = ref<HTMLElement | null>(null)

// Composables
const { connections, barPositions, getConnectorProps, initializeConnections, updateBarPositions } =
  useConnections(rowManager, props, id)

const { showTooltip, tooltipBar, initTooltip, clearTooltip } = useTooltip()

const rowsContainer = ref<HTMLElement | null>(null)
const labelColumn = ref<InstanceType<typeof GGanttLabelColumn> | null>(null)

const {
  zoomFactor,
  maxZoom,
  ganttPosition,
  ganttStep,
  handleStep,
  handleScroll,
  handleWheel,
  handleContentScroll,
  handleLabelScroll,
  decreaseZoom,
  increaseZoom,
  scrollRowUp,
  scrollRowDown,
  isAtTop,
  isAtBottom
} = useChartNavigation(
  {
    diffDays: diffDays.value,
    diffHours: diffHours.value,
    scrollRefs: {
      rowsContainer,
      labelColumn
    }
  },
  props.maxRows
)

const navigationControls = {
  zoomFactor,
  ganttPosition,
  ganttStep,
  handleStep,
  handleScroll,
  handleWheel,
  handleContentScroll,
  handleLabelScroll,
  decreaseZoom,
  increaseZoom,
  scrollRowUp,
  scrollRowDown
}

const { handleKeyDown } = useKeyboardNavigation(navigationControls, ganttWrapper, ganttContainer)

// Derived State
const widthNumber = computed(() => zoomFactor.value * 100)
const customWidth = computed(() => `${widthNumber.value}%`)

const { font, colorScheme } = toRefs(props)

const getColorScheme = (scheme: string | ColorScheme): ColorScheme =>
  typeof scheme !== "string"
    ? scheme
    : ((colorSchemes[scheme as ColorSchemeKey] || colorSchemes.default) as ColorScheme)

const colors = computed(() => getColorScheme(colorScheme.value))

// Time Axis Interaction State
const isDragging = ref(false)
const isDraggingTimeaxis = ref(false)
const lastMouseX = ref(0)

// Time Axis Event Handlers
const handleTimeaxisMouseDown = (e: MouseEvent) => {
  isDraggingTimeaxis.value = true
  lastMouseX.value = e.clientX
}

const handleTimeaxisMouseMove = (e: MouseEvent) => {
  if (!isDraggingTimeaxis.value || !ganttWrapper.value) return

  const deltaX = e.clientX - lastMouseX.value
  lastMouseX.value = e.clientX

  ganttWrapper.value.scrollLeft -= deltaX
  const maxScroll = ganttWrapper.value.scrollWidth - ganttWrapper.value.clientWidth
  ganttPosition.value = (ganttWrapper.value.scrollLeft / maxScroll) * 100
}

const handleTimeaxisMouseUp = () => {
  isDraggingTimeaxis.value = false
}

// Bar Event Handling
const emitBarEvent = (
  e: MouseEvent,
  bar: GanttBarObject,
  datetime?: string | Date,
  movedBars?: Map<GanttBarObject, { oldStart: string; oldEnd: string }>
) => {
  switch (e.type) {
    case "click":
      emit("click-bar", { bar, e, datetime })
      break
    case "mousedown":
      emit("mousedown-bar", { bar, e, datetime })
      break
    case "mouseup":
      emit("mouseup-bar", { bar, e, datetime })
      break
    case "dblclick":
      emit("dblclick-bar", { bar, e, datetime })
      break
    case "mouseenter":
      initTooltip(bar)
      emit("mouseenter-bar", { bar, e })
      break
    case "mouseleave":
      clearTooltip()
      emit("mouseleave-bar", { bar, e })
      break
    case "dragstart":
      isDragging.value = true
      emit("dragstart-bar", { bar, e })
      updateBarPositions()
      break
    case "drag":
      emit("drag-bar", { bar, e })
      updateBarPositions()
      break
    case "dragend":
      isDragging.value = false
      emit("dragend-bar", { bar, e, movedBars })
      updateBarPositions()
      break
    case "contextmenu":
      emit("contextmenu-bar", { bar, e, datetime })
      break
  }
}

// Style Updates
const updateRangeBackground = () => {
  const parentElement = document.getElementById(id.value)
  const slider = parentElement!.querySelector(".g-gantt-scroller") as HTMLInputElement
  if (slider) {
    slider.style.setProperty("--value", `${ganttPosition.value}%`)
  }
}

// ResizeObserver instance
let resizeObserver: ResizeObserver

// Lifecycle Hooks
onMounted(() => {
  const cleanup = rowManager.onSortChange(updateBarPositions)
  onUnmounted(cleanup)
  if (ganttWrapper.value) {
    ganttWrapper.value.addEventListener("wheel", (e) => handleWheel(e, ganttWrapper.value!))
  }

  window.addEventListener("mousemove", handleTimeaxisMouseMove)
  window.addEventListener("mouseup", handleTimeaxisMouseUp)

  resizeObserver = new ResizeObserver(updateBarPositions)
  const container = document.querySelector(".g-gantt-chart")
  if (container) {
    resizeObserver.observe(container)
  }

  window.addEventListener("resize", updateBarPositions)
  initializeConnections()

  nextTick(() => {
    updateBarPositions()
  })

  // Watchers
  watch(ganttPosition, updateRangeBackground, { immediate: true })
})

onUnmounted(() => {
  if (ganttWrapper.value) {
    ganttWrapper.value.removeEventListener("wheel", (e) => handleWheel(e, ganttWrapper.value!))
  }

  window.removeEventListener("mousemove", handleTimeaxisMouseMove)
  window.removeEventListener("mouseup", handleTimeaxisMouseUp)

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  window.removeEventListener("resize", updateBarPositions)
})

// Provider Setup
provide(CONFIG_KEY, {
  ...toRefs(props),
  colors,
  chartSize,
  widthNumber
})
provide(EMIT_BAR_EVENT_KEY, emitBarEvent)
provide(BOOLEAN_KEY, { ...props })
provide("id", id)
</script>

<template>
  <div
    class="g-gantt-container"
    role="application"
    aria-label="Interactive Gantt"
    tabindex="0"
    @keydown="handleKeyDown"
    ref="ganttContainer"
    :id="id"
  >
    <div class="g-gantt-rounded-wrapper">
      <!-- Chart Layout Section -->
      <div :class="[{ 'labels-in-column': !!labelColumnTitle }]" aria-controls="gantt-controls">
        <!-- Label Column -->
        <g-gantt-label-column v-if="labelColumnTitle" ref="labelColumn" @scroll="handleLabelScroll">
          <template #label-column-title>
            <slot name="label-column-title" />
          </template>
          <template #label-column-row="slotProps">
            <slot name="label-column-row" v-bind="slotProps" />
          </template>
        </g-gantt-label-column>

        <!-- Chart Wrapper -->
        <div
          ref="ganttWrapper"
          class="gantt-wrapper"
          :style="{
            width: '100%',
            'overflow-x': commands ? 'hidden' : 'auto'
          }"
        >
          <!-- Main Chart -->
          <div
            ref="ganttChart"
            class="g-gantt-chart"
            :style="{
              width: customWidth,
              background: colors.background,
              fontFamily: font
            }"
          >
            <!-- Timeaxis Component -->
            <g-gantt-timeaxis
              v-if="!hideTimeaxis"
              ref="timeaxisComponent"
              @drag-start="handleTimeaxisMouseDown"
            >
              <template #upper-timeunit="slotProps">
                <slot name="upper-timeunit" v-bind="slotProps" />
              </template>
              <template #timeunit="slotProps">
                <slot name="timeunit" v-bind="slotProps" />
              </template>
            </g-gantt-timeaxis>

            <!-- Optional Components -->
            <g-gantt-grid v-if="grid" :highlighted-units="highlightedUnits" />
            <g-gantt-current-time v-if="currentTime">
              <template #current-time-label>
                <slot name="current-time-label" />
              </template>
            </g-gantt-current-time>

            <!-- Rows Container -->
            <div
              class="g-gantt-rows-container"
              :style="rowsContainerStyle"
              ref="rowsContainer"
              @scroll="handleContentScroll"
            >
              <g-gantt-row
                v-for="row in rows"
                :key="row.id || row.label"
                :label="row.label"
                :bars="row.bars"
              >
                <template #bar-label="slotProps">
                  <slot name="bar-label" v-bind="slotProps" />
                </template>
              </g-gantt-row>
              <!-- Connections -->
              <template v-if="enableConnections">
                <template v-for="conn in connections" :key="`${conn.sourceId}-${conn.targetId}`">
                  <g-gantt-connector
                    v-if="barPositions.get(conn.sourceId) && barPositions.get(conn.targetId)"
                    v-bind="getConnectorProps(conn)!"
                  />
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls Section -->
      <div
        v-if="commands"
        class="g-gantt-command"
        :style="{ background: colors.commands, fontFamily: font }"
        aria-label="Gantt Commands"
      >
        <!-- Navigation Controls -->
        <div class="g-gantt-command-vertical" v-if="maxRows > 0 && rows.length > maxRows">
          <button @click="scrollRowUp" aria-label="Scroll row up" :disabled="isAtTop">
            <FontAwesomeIcon :icon="faAngleUp" class="command-icon" />
          </button>
          <button @click="scrollRowDown" aria-label="Scroll row down" :disabled="isAtBottom">
            <FontAwesomeIcon :icon="faAngleDown" class="command-icon" />
          </button>
        </div>
        <div class="g-gantt-command-fixed">
          <div class="g-gantt-command-slider">
            <button
              :disabled="ganttPosition === 0"
              @click="handleStep(0, ganttWrapper!)"
              aria-label="Scroll to start"
            >
              <FontAwesomeIcon :icon="faAnglesLeft" class="command-icon" />
            </button>
            <button
              :disabled="ganttPosition === 0"
              @click="handleStep(ganttPosition - ganttStep, ganttWrapper!)"
              aria-label="Scroll back"
            >
              <FontAwesomeIcon :icon="faAngleLeft" class="command-icon" />
            </button>

            <!-- Position Slider -->
            <input
              v-model="ganttPosition"
              type="range"
              min="0"
              max="100"
              class="g-gantt-scroller"
              :style="{ '--value': `${ganttPosition}%` }"
              @input="handleScroll(ganttWrapper!)"
              :aria-valuemin="0"
              :aria-valuemax="100"
              :aria-valuenow="ganttPosition"
              aria-label="Gantt scroll position"
            />

            <button
              :disabled="ganttPosition === 100"
              @click="handleStep(Number(ganttPosition) + Number(ganttStep), ganttWrapper!)"
              aria-label="Scroll up"
            >
              <FontAwesomeIcon :icon="faAngleRight" class="command-icon" />
            </button>
            <button
              :disabled="ganttPosition === 100"
              @click="handleStep(100, ganttWrapper!)"
              aria-label="Scroll to end"
            >
              <FontAwesomeIcon :icon="faAnglesRight" class="command-icon" />
            </button>
          </div>
        </div>

        <!-- Zoom Controls -->
        <div class="g-gantt-command-zoom">
          <button @click="decreaseZoom" aria-label="Zoom-out Gantt" :disabled="zoomFactor === 1">
            <FontAwesomeIcon :icon="faMagnifyingGlassMinus" class="command-icon" />
          </button>
          <button
            @click="increaseZoom"
            aria-label="Zoom-out Gantt"
            :disabled="zoomFactor === maxZoom"
          >
            <FontAwesomeIcon :icon="faMagnifyingGlassPlus" class="command-icon" />
          </button>
        </div>

        <!-- Custom Commands Slot -->
        <div class="g-gantt-command-custom">
          <slot name="commands" />
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <g-gantt-bar-tooltip :model-value="showTooltip || isDragging" :bar="tooltipBar">
      <template #default="slotProps">
        <slot name="bar-tooltip" v-bind="slotProps" />
      </template>
    </g-gantt-bar-tooltip>
  </div>
</template>

<style>
.g-gantt-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}
/* Layout */
.g-gantt-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  -webkit-touch-callout: none;
  user-select: none;
  font-variant-numeric: tabular-nums;
}

/* Container Styles */
.g-gantt-rows-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.labels-in-column {
  display: flex;
  flex-direction: row;
}

/* Command Section Styles */
.g-gantt-command {
  display: flex;
  align-items: center;
  height: 40px;
  border-top: 1px solid #eaeaea;
  padding: 0px 6px;
  gap: 8px;
}

.g-gantt-command-fixed,
.g-gantt-command-slider,
.g-gantt-command-zoom {
  display: flex;
  align-items: center;
  gap: 2px;
}

.g-gantt-command-custom {
  flex-grow: 1;
}

.g-gantt-command-vertical {
  display: flex;
  gap: 2px;
  margin-left: 8px;
}

.g-gantt-command-vertical button:disabled,
.g-gantt-command-slider button:disabled,
.g-gantt-command-zoom button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scroller Styles */
.g-gantt-scroller {
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  outline: none;
  background: linear-gradient(
    to right,
    v-bind(colors.rangeHighlight) var(--value),
    #ddd var(--value)
  );
}

/* Scroller Thumb Styles */
.g-gantt-scroller::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: v-bind(colors.rangeHighlight);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.g-gantt-scroller::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: v-bind(colors.rangeHighlight);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* Track Styles */
.g-gantt-scroller::-moz-range-track {
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  border: none;
}

/* Hover States */
.g-gantt-scroller::-webkit-slider-thumb:hover {
  background: v-bind(colors.rangeHighlight);
}

.g-gantt-scroller::-moz-range-thumb:hover {
  background: v-bind(colors.rangeHighlight);
}

/* Icon Styles */
.command-icon {
  background: v-bind(colors.rangeHighlight);
  padding: 4px;
  margin: 2px;
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

button {
  display: flex;
}

.g-gantt-chart:focus-within {
  outline: 2px solid v-bind(colors.primary);
  outline-offset: 2px;
}

.g-gantt-rounded-wrapper {
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid #eaeaea;
  background: white;
  display: flex;
  flex-direction: column;
}

.g-gantt-rows-container::-webkit-scrollbar {
  display: none;
}
</style>
