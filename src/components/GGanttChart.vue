<template>
  <div>
    <div :class="[{ 'labels-in-column': !!labelColumnTitle }]">
      <g-gantt-label-column
        v-if="labelColumnTitle"
        :style="{
          width: labelColumnWidth
        }"
      >
        <template #label-column-title>
          <slot name="label-column-title" />
        </template>
        <template #label-column-row="{ label }">
          <slot name="label-column-row" :label="label" />
        </template>
      </g-gantt-label-column>
      <div
        ref="ganttWrapper"
        :style="{
          width: '100%',
          'overflow-x': commands ? 'hidden' : 'auto',
          'border-top-right-radius': '5px'
        }"
      >
        <div
          ref="ganttChart"
          :class="['g-gantt-chart', { 'with-column': labelColumnTitle }]"
          :style="{ width: customWidth, background: colors.background, fontFamily: font }"
        >
          <g-gantt-timeaxis
            v-if="!hideTimeaxis"
            ref="timeaxisComponent"
            @drag-start="handleTimeaxisMouseDown"
          >
            <template #upper-timeunit="{ label, value, date }">
              <!-- expose upper-timeunit slot of g-gantt-timeaxis-->
              <slot name="upper-timeunit" :label="label" :value="value" :date="date" />
            </template>
            <template #timeunit="{ label, value, date }">
              <!-- expose timeunit slot of g-gantt-timeaxis-->
              <slot name="timeunit" :label="label" :value="value" :date="date" />
            </template>
          </g-gantt-timeaxis>
          <g-gantt-grid v-if="grid" :highlighted-units="highlightedUnits" />
          <g-gantt-current-time v-if="currentTime">
            <template #current-time-label>
              <slot name="current-time-label" />
            </template>
          </g-gantt-current-time>
          <div class="g-gantt-rows-container">
            <slot />
            <!-- the g-gantt-row components go here -->
            <template v-if="enableConnections">
              <template v-for="conn in connections" :key="`${conn.sourceId}-${conn.targetId}`">
                <g-gantt-connector
                  v-if="barPositions.get(conn.sourceId) && barPositions.get(conn.targetId)"
                  :source-bar="barPositions.get(conn.sourceId)!"
                  :target-bar="barPositions.get(conn.targetId)!"
                  :type="conn.type || defaultConnectionType"
                  :color="conn.color || defaultConnectionColor"
                />
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="commands"
      class="g-gantt-command"
      :style="{ background: colors.commands, fontFamily: font }"
    >
      <div class="g-gantt-command-fixed">
        <div class="g-gantt-command-slider">
          <button :disabled="ganttPosition === 0" @click="handleStep(0)">
            <FontAwesomeIcon :icon="faAnglesLeft" class="command-icon" />
          </button>
          <button :disabled="ganttPosition === 0" @click="handleStep(ganttPosition - ganttStep)">
            <FontAwesomeIcon :icon="faAngleLeft" class="command-icon" />
          </button>
          <input
            v-model="ganttPosition"
            type="range"
            min="0"
            max="100"
            class="g-gantt-scroller"
            style="--value: 0%"
            @input="handleScroll"
          />
          <button
            :disabled="ganttPosition === 100"
            @click="handleStep(Number(ganttPosition) + Number(ganttStep))"
          >
            <FontAwesomeIcon :icon="faAngleRight" class="command-icon" />
          </button>
          <button :disabled="ganttPosition === 100" @click="handleStep(100)">
            <FontAwesomeIcon :icon="faAnglesRight" class="command-icon" />
          </button>
        </div>
      </div>
      <div class="g-gantt-command-zoom">
        <button>
          <FontAwesomeIcon
            :icon="faMagnifyingGlassMinus"
            class="command-icon"
            @click="decreaseZoom"
          />
        </button>
        <button>
          <FontAwesomeIcon
            :icon="faMagnifyingGlassPlus"
            class="command-icon"
            @click="increaseZoom"
          />
        </button>
      </div>
      <div class="g-gantt-command-custom">
        <slot name="commands" />
      </div>
    </div>

    <g-gantt-bar-tooltip :model-value="showTooltip || isDragging" :bar="tooltipBar">
      <template #default>
        <slot name="bar-tooltip" :bar="tooltipBar" />
      </template>
    </g-gantt-bar-tooltip>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faAnglesLeft,
  faAngleLeft,
  faAngleRight,
  faAnglesRight,
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
  useSlots,
  watch,
  type ComputedRef,
  type Ref,
  type ToRefs
} from "vue"

import GGanttGrid from "./GGanttGrid.vue"
import GGanttLabelColumn from "./GGanttLabelColumn.vue"
import GGanttTimeaxis from "./GGanttTimeaxis.vue"
import GGanttBarTooltip from "./GGanttBarTooltip.vue"
import GGanttCurrentTime from "./GGanttCurrentTime.vue"
import GGanttConnector from "./GGanttConnector.vue"

import type { ColorSchemeKey } from "../color-schemes.js"

import { useElementSize } from "@vueuse/core"
import { DEFAULT_DATE_FORMAT } from "../composables/useDayjsHelper"
import { colorSchemes } from "../color-schemes.js"
import { BOOLEAN_KEY, CHART_ROWS_KEY, CONFIG_KEY, EMIT_BAR_EVENT_KEY } from "../provider/symbols.js"
import dayjs from "dayjs"
import type {
  BarConnection,
  BarPosition,
  GanttBarObject,
  GGanttChartProps,
  ChartRow
} from "../types"

const props = withDefaults(defineProps<GGanttChartProps>(), {
  currentTimeLabel: "",
  dateFormat: DEFAULT_DATE_FORMAT,
  precision: "day",
  width: "100%",
  hideTimeaxis: false,
  colorScheme: "default",
  grid: false,
  pushOnOverlap: false,
  noOverlap: false,
  rowHeight: 40,
  highlightedUnits: () => [],
  font: "inherit",
  labelColumnTitle: "",
  labelColumnWidth: "150px",
  commands: true,
  enableMinutes: false,
  enableConnections: true,
  defaultConnectionType: "straight",
  defaultConnectionColor: "#ff0000"
})

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
}>()

const chartStartDayjs = computed(() => dayjs(props.chartStart, props.dateFormat as string, true))
const chartEndDayjs = computed(() => dayjs(props.chartEnd, props.dateFormat as string, true))

const diffDays = computed(() => chartEndDayjs.value.diff(chartStartDayjs.value, "day") + 1)
const diffHours = computed(() => chartEndDayjs.value.diff(chartStartDayjs.value, "hour"))

const zoomFactor = ref(diffDays.value)

const widthNumber = computed(() => zoomFactor.value * 100)

const customWidth = computed(() => `${widthNumber.value}%`)

const { font, colorScheme } = toRefs(props)

const slots = useSlots()
const colors = computed(() =>
  typeof colorScheme.value !== "string"
    ? colorScheme.value
    : colorSchemes[colorScheme.value as ColorSchemeKey] || colorSchemes.default
)

const getChartRows = () => {
  const defaultSlot = slots.default?.()
  const allBars: ChartRow[] = []

  if (!defaultSlot) {
    return allBars
  }
  defaultSlot.forEach((child) => {
    if (child.props?.bars) {
      const { label, bars } = child.props
      allBars.push({ label, bars })
      // if using v-for to generate rows, rows will be children of a single "fragment" v-node:
    } else if (Array.isArray(child.children)) {
      child.children.forEach((grandchild) => {
        const granchildNode = grandchild as {
          props?: ChartRow
        }
        if (granchildNode?.props?.bars) {
          const { label, bars } = granchildNode.props
          allBars.push({ label, bars })
        }
      })
    }
  })
  return allBars
}

const flatBars = getChartRows().flatMap((el: ChartRow) => el.bars)

const showTooltip = ref(false)
const isDragging = ref(false)
const tooltipBar = ref<GanttBarObject | undefined>(undefined)
let tooltipTimeoutId: ReturnType<typeof setTimeout>
const initTooltip = (bar: GanttBarObject) => {
  if (tooltipTimeoutId) {
    clearTimeout(tooltipTimeoutId)
  }
  tooltipTimeoutId = setTimeout(() => {
    showTooltip.value = true
  }, 800)
  tooltipBar.value = bar
}

const clearTooltip = () => {
  clearTimeout(tooltipTimeoutId)
  showTooltip.value = false
}

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

const radius = computed(() => {
  return props.commands ? "0px" : "5px"
})

const ganttChart = ref<HTMLElement | null>(null)
const chartSize = useElementSize(ganttChart)

const ganttPosition = ref(0)
const ganttStep = computed(() => 100 / diffHours.value)
const ganttWrapper = ref<HTMLElement | null>(null)

const handleStep = (value: number) => {
  if (!ganttWrapper.value) return
  ganttPosition.value = value
  const maxScroll = ganttWrapper.value.scrollWidth - ganttWrapper.value.clientWidth
  const scrollValue = (maxScroll * ganttPosition.value) / 100
  ganttWrapper.value.scrollLeft = scrollValue
}

const handleScroll = () => {
  if (!ganttWrapper.value) return

  const maxScroll = ganttWrapper.value.scrollWidth - ganttWrapper.value.clientWidth
  const scrollValue = (maxScroll * ganttPosition.value) / 100
  ganttWrapper.value.scrollLeft = scrollValue
}

const handleWheel = (e: WheelEvent) => {
  if (!ganttWrapper.value) return
  const maxScroll = ganttWrapper.value.scrollWidth - ganttWrapper.value.clientWidth
  ganttWrapper.value.scrollLeft += e.deltaX || e.deltaY
  ganttPosition.value = (ganttWrapper.value.scrollLeft / maxScroll) * 100
}

const timeaxisComponent = ref<InstanceType<typeof GGanttTimeaxis> | null>(null)
const isDraggingTimeaxis = ref(false)
const lastMouseX = ref(0)

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

const updateRangeBackground = () => {
  const slider = document.querySelector(".g-gantt-scroller") as HTMLInputElement
  if (slider) {
    slider.style.setProperty("--value", `${ganttPosition.value}%`)
  }
}

const decreaseZoom = () => {
  if (zoomFactor.value === 1) return
  zoomFactor.value = zoomFactor.value - 1
}

const increaseZoom = () => {
  if (zoomFactor.value === 10) return
  zoomFactor.value = zoomFactor.value + 1
}

watch(ganttPosition, updateRangeBackground, { immediate: true })
let resizeObserver: ResizeObserver

onMounted(() => {
  ganttWrapper.value?.addEventListener("wheel", handleWheel)
  window.addEventListener("mousemove", handleTimeaxisMouseMove)
  window.addEventListener("mouseup", handleTimeaxisMouseUp)
  resizeObserver = new ResizeObserver(updateBarPositions)
  const container = document.querySelector(".g-gantt-chart") // Cambiato qui
  if (container) {
    resizeObserver.observe(container)
  }

  window.addEventListener("resize", updateBarPositions)

  nextTick(() => {
    updateBarPositions()
  })
})

onUnmounted(() => {
  ganttWrapper.value?.removeEventListener("wheel", handleWheel)
  window.removeEventListener("mousemove", handleTimeaxisMouseMove)
  window.removeEventListener("mouseup", handleTimeaxisMouseUp)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener("resize", updateBarPositions)
})

provide(CHART_ROWS_KEY, getChartRows)
provide(CONFIG_KEY, {
  ...toRefs(props),
  colors,
  chartSize,
  widthNumber
})
provide(EMIT_BAR_EVENT_KEY, emitBarEvent)
provide(BOOLEAN_KEY, { ...props })

const connections = ref<BarConnection[]>([])

flatBars.forEach((el) => {
  if (el.ganttBarConfig.connections?.length) {
    el.ganttBarConfig.connections.forEach((conn) => {
      connections.value.push({
        sourceId: el.ganttBarConfig.id,
        targetId: conn.targetId,
        type: conn.connectionType,
        color: conn.connectionColor
      })
    })
  }
})

const barPositions = ref<Map<string, BarPosition>>(new Map())

const updateBarPositions = async () => {
  await nextTick()

  const rowsContainer = document.querySelector(".g-gantt-rows-container")
  if (!rowsContainer) return

  const containerRect = rowsContainer.getBoundingClientRect()
  const bars = document.querySelectorAll(".g-gantt-bar")

  await new Promise((resolve) => requestAnimationFrame(resolve))

  barPositions.value.clear()

  bars.forEach((bar) => {
    const rect = bar.getBoundingClientRect()
    const barId = bar.getAttribute("id")

    if (barId) {
      const position = {
        id: barId,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      }
      barPositions.value.set(barId, position)
    }
  })
}
</script>

<style>
.g-gantt-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  -webkit-touch-callout: none;
  user-select: none;
  font-variant-numeric: tabular-nums;
  border-radius: 5px;
  border-bottom-right-radius: v-bind(radius);
}

.with-column {
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  border-top-right-radius: 5px;
  border-bottom-right-radius: v-bind(radius);
}

.g-gantt-rows-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.labels-in-column {
  display: flex;
  flex-direction: row;
}

.g-gantt-command {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
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

.g-gantt-scroller {
  -webkit-appearance: none;
  //width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  background: linear-gradient(
    to right,
    v-bind(colors.rangeHighlight) var(--value),
    #ddd var(--value)
  );
}

/* thumb  */
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

/* Firefox */
.g-gantt-scroller::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: v-bind(colors.rangeHighlight);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.g-gantt-scroller::-moz-range-track {
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  border: none;
}

/* Hover state */
.g-gantt-scroller::-webkit-slider-thumb:hover {
  background: v-bind(colors.rangeHighlight);
}

.g-gantt-scroller::-moz-range-thumb:hover {
  background: v-bind(colors.rangeHighlight);
}

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
</style>
