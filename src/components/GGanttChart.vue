<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faAnglesLeft,
  faAngleLeft,
  faAngleRight,
  faAnglesRight,
  faAngleUp,
  faAngleDown,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faExpandAlt,
  faCompressAlt,
  faUndo,
  faRedo
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
  watch,
  h
} from "vue"
import { useElementSize } from "@vueuse/core"
import { v4 as uuidv4 } from "uuid"
import type { CSSProperties } from "vue"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Components
import GGanttGrid from "./GGanttGrid.vue"
import GGanttLabelColumn from "./GGanttLabelColumn.vue"
import GGanttTimeaxis from "./GGanttTimeaxis.vue"
import GGanttBarTooltip from "./GGanttBarTooltip.vue"
import GGanttCurrentTime from "./GGanttCurrentTime.vue"
import GGanttConnector from "./GGanttConnector.vue"
import GGanttMilestone from "./GGanttMilestone.vue"
import GGanttRow from "./GGanttRow.vue"

// Composables
import { useConnections } from "../composables/useConnections"
import { useTooltip } from "../composables/useTooltip"
import { useChartNavigation } from "../composables/useChartNavigation"
import { useKeyboardNavigation } from "../composables/useKeyboardNavigation"
import { useRows, findBarInRows } from "../composables/useRows"
import { ganttWidth } from "../composables/useSimpleStore"
import useTimeaxisUnits from "../composables/useTimeaxisUnits"
import { useSectionResize } from "../composables/useSectionResize"

// Types and Constants
import { colorSchemes, type ColorSchemeKey } from "../color-schemes"
import { DEFAULT_DATE_FORMAT } from "../composables/useDayjsHelper"
import { BOOLEAN_KEY, CONFIG_KEY, EMIT_BAR_EVENT_KEY, GANTT_ID_KEY } from "../provider/symbols"
import type {
  GanttBarObject,
  GGanttChartProps,
  SortState,
  GGanttTimeaxisInstance,
  ColorScheme,
  ChartRow,
  RowDragEvent
} from "../types"

// Props
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
  font: "inherit",
  labelColumnTitle: "",
  labelColumnWidth: 120,
  commands: true,
  enableMinutes: false,
  enableConnections: true,
  defaultConnectionType: "straight",
  defaultConnectionColor: "#ff0000",
  defaultConnectionPattern: "solid",
  defaultConnectionAnimated: false,
  defaultConnectionAnimationSpeed: "normal",
  maxRows: 0,
  initialSort: () => ({
    column: "Label",
    direction: "none"
  }),
  initialRows: () => [],
  multiColumnLabel: () => [],
  sortable: true,
  labelResizable: true,
  milestones: () => [],
  holidayHighlight: "",
  rowClass: () => "",
  rowLabelClass: () => "",
  dayOptionLabel: () => ["day"],
  highlightedHours: () => [],
  highlightedDaysInWeek: () => [],
  highlightedDaysInMonth: () => [],
  highlightedMonths: () => [],
  highlightedWeek: () => [],
  locale: "en",
  enableRowDragAndDrop: false,
  markerConnection: "forward",
  showLabel: true,
  showProgress: true,
  defaultProgressResizable: true
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
  (e: "sort", value: { sortState: SortState }): void
  (e: "group-expansion", value: { rowId: string | number }): void
  (
    e: "row-drop",
    value: {
      sourceRow: ChartRow
      targetRow?: ChartRow
      newIndex: number
      parentId?: string | number
    }
  ): void
  (e: "progress-drag-start", value: { bar: GanttBarObject; e: MouseEvent }): void
  (e: "progress-change", value: { bar: GanttBarObject; e: MouseEvent }): void
  (e: "progress-drag-end", value: { bar: GanttBarObject; e: MouseEvent }): void
}>()

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------

// Basic State
const id = ref(uuidv4())
const slots = useSlots()
const isDragging = ref(false)
const isDraggingTimeaxis = ref(false)
const lastMouseX = ref(0)

// Component Refs
const ganttChart = ref<HTMLElement | null>(null)
const ganttWrapper = ref<HTMLElement | null>(null)
const timeaxisComponent = ref<
  (InstanceType<typeof GGanttTimeaxis> & GGanttTimeaxisInstance) | null
>(null)
const ganttContainer = ref<HTMLElement | null>(null)
const rowsContainer = ref<HTMLElement | null>(null)
const labelColumn = ref<InstanceType<typeof GGanttLabelColumn> | null>(null)

const setLabelWidth = () => {
  return (
    props.labelColumnWidth *
    (props.multiColumnLabel.length === 0
      ? 1
      : props.multiColumnLabel.length +
        (props.multiColumnLabel.some((el) => el.field === "Label") ? 0 : 1))
  )
}
const labelSectionWidth = ref(setLabelWidth())

watch(
  () => props.multiColumnLabel,
  () => {
    labelSectionWidth.value = setLabelWidth()
  }
)

// Chart Size
const chartSize = useElementSize(ganttChart)

// Touch State
const handleTimeaxisTouch = {
  startX: 0,
  isDragging: false
}

// -----------------------------
// 5. COMPOSABLES & PROVIDERS
// -----------------------------

// Row Management
const rowManager = useRows(
  slots,
  {
    barStart: toRef(props, "barStart"),
    barEnd: toRef(props, "barEnd"),
    dateFormat: toRef(props, "dateFormat"),
    multiColumnLabel: toRef(props, "multiColumnLabel"),
    onSort: (sortState) => emit("sort", { sortState }),
    initialSort: props.initialSort,
    onGroupExpansion: (rowId) => emit("group-expansion", { rowId })
  },
  props.initialRows ? toRef(props, "initialRows") : undefined
)

provide("useRows", rowManager)

// Connections Management
const { connections, barPositions, getConnectorProps, initializeConnections, updateBarPositions } =
  useConnections(rowManager, props, id)

// Tooltip Management
const { showTooltip, tooltipBar, initTooltip, clearTooltip } = useTooltip()

// Color Scheme Management
const { font, colorScheme } = toRefs(props)
const colors = computed(() => getColorScheme(colorScheme.value))

// Time Units Management
const { timeaxisUnits, internalPrecision, zoomLevel, adjustZoomAndPrecision } = useTimeaxisUnits({
  ...toRefs(props),
  colors,
  chartSize
})

// Navigation Management
const {
  scrollPosition,
  handleStep,
  handleScroll,
  handleWheel,
  handleContentScroll,
  handleLabelScroll,
  handleZoomUpdate,
  scrollRowUp,
  scrollRowDown,
  isAtTop,
  isAtBottom
} = useChartNavigation(
  {
    scrollRefs: {
      rowsContainer,
      labelColumn
    },
    updateBarPositions,
    timeaxisUnits: { timeaxisUnits, internalPrecision, zoomLevel, adjustZoomAndPrecision }
  },
  props.maxRows
)

// Keyboard Navigation
const { handleKeyDown } = useKeyboardNavigation(
  {
    scrollPosition,
    handleStep,
    handleZoomUpdate
  },
  ganttWrapper,
  ganttContainer
)

// Size Management
const {
  handleResizeStart,
  handleResizeMove,
  handleResizeEnd,
  handleTouchStart,
  handleTouchMove,
  resetResizeState
} = useSectionResize()

// -----------------------------
// 6. COMPUTED PROPERTIES
// -----------------------------
const rows = computed(() => rowManager.rows.value)

const rowsContainerStyle = computed<CSSProperties>(() => {
  if (props.maxRows === 0) return {}

  return {
    "max-height": `${props.maxRows * props.rowHeight}px`,
    "overflow-y": "auto"
  }
})

const totalWidth = computed(() => {
  const lowerUnits = timeaxisUnits.value!.result.lowerUnits
  return lowerUnits.reduce((total, unit) => {
    return total + parseInt(unit.width!)
  }, 0)
})

const hasGroupRows = computed(() => {
  const checkForGroups = (rows: ChartRow[]): boolean => {
    return rows.some(
      (row) => row.children?.length! > 0 || (row.children && checkForGroups(row.children))
    )
  }
  return checkForGroups(rows.value)
})

const labelSectionStyle = computed(() => ({
  width: `${labelSectionWidth.value}px`,
  maxWidth: `${labelSectionWidth.value}px`,
  position: "relative" as const,
  flexShrink: 0,
  flexGrow: 0
}))

// -----------------------------
// 7. EVENT HANDLERS
// -----------------------------

// Timeaxis Mouse Events
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
  scrollPosition.value = (ganttWrapper.value.scrollLeft / maxScroll) * 100
}

const handleTimeaxisMouseUp = () => {
  isDraggingTimeaxis.value = false
}

// Timeaxis Touch Events
const handleTimeaxisTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  if (!touch) return

  handleTimeaxisTouch.isDragging = true
  handleTimeaxisTouch.startX = touch.clientX
  e.preventDefault()
}

const handleTimeaxisTouchMove = (e: TouchEvent) => {
  if (!handleTimeaxisTouch.isDragging || !ganttWrapper.value) return

  const touch = e.touches[0]
  if (!touch) return

  const deltaX = touch.clientX - handleTimeaxisTouch.startX
  handleTimeaxisTouch.startX = touch.clientX

  ganttWrapper.value.scrollLeft -= deltaX
  const maxScroll = ganttWrapper.value.scrollWidth - ganttWrapper.value.clientWidth
  scrollPosition.value = (ganttWrapper.value.scrollLeft / maxScroll) * 100

  e.preventDefault()
}

const handleTimeaxisTouchEnd = () => {
  handleTimeaxisTouch.isDragging = false
}

const handleSectionResize = (newWidth: number) => {
  labelSectionWidth.value = newWidth
}

// Bar Events
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
      rowManager.onBarMove()
      break
    case "contextmenu":
      emit("contextmenu-bar", { bar, e, datetime })
      break
    case "progress-drag-start":
      initTooltip(bar)
      emit("progress-drag-start", { bar, e })
      break
    case "progress-change":
      initTooltip(bar)
      emit("progress-change", { bar, e })
      break
    case "progress-drag-end":
      initTooltip(bar)
      emit("progress-drag-end", { bar, e })
      break
  }
}

// Row Events
const dropRow = (event: RowDragEvent) => {
  emit("row-drop", event)
  updateBarPositions()
}

// -----------------------------
// 8. SUPPORT FUNCTIONS
// -----------------------------

const getColorScheme = (scheme: string | ColorScheme): ColorScheme =>
  typeof scheme !== "string"
    ? scheme
    : ((colorSchemes[scheme as ColorSchemeKey] || colorSchemes.default) as ColorScheme)

watch(
  () => totalWidth.value,
  () => {
    ganttWidth.value = totalWidth.value
  },
  { immediate: true }
)

const renderRow = (row: ChartRow) => {
  if (row._originalNode) {
    return h(
      GGanttRow,
      {
        ...row._originalNode.props,
        label: row.label,
        bars: row.bars,
        children: row.children,
        id: row.id,
        key: row.id || row.label
      },
      row._originalNode.children || {}
    )
  }

  return h(GGanttRow, {
    label: row.label,
    bars: row.bars,
    id: row.id,
    key: row.id || row.label
  })
}

const updateRangeBackground = () => {
  const parentElement = document.getElementById(id.value)
  const slider = parentElement!.querySelector(".g-gantt-scroller") as HTMLInputElement
  if (slider) {
    slider.style.setProperty("--value", `${scrollPosition.value}%`)
  }
}

// -----------------------------
// 9. HISTORY MANAGEMENT
// -----------------------------

const undo = () => {
  const changes = rowManager.undo()
  if (!changes) return

  changes.rowChanges.forEach((rowChange) => {
    emit("row-drop", {
      sourceRow: rowChange.sourceRow,
      targetRow: undefined,
      newIndex: rowChange.newIndex,
      parentId: rowChange.newParentId
    })
  })

  changes.barChanges.forEach((barChange) => {
    const bar = findBarInRows(rowManager.rows.value, barChange.barId)
    if (!bar) return

    emit("dragend-bar", {
      bar,
      e: new MouseEvent("mouseup"),
      movedBars: new Map([
        [
          bar,
          {
            oldStart: barChange.newStart!,
            oldEnd: barChange.newEnd!
          }
        ]
      ])
    })
  })

  updateBarPositions()
}

const redo = () => {
  const changes = rowManager.redo()
  if (!changes) return

  changes.rowChanges.forEach((rowChange) => {
    emit("row-drop", {
      sourceRow: rowChange.sourceRow,
      targetRow: undefined,
      newIndex: rowChange.newIndex,
      parentId: rowChange.newParentId
    })
  })

  changes.barChanges.forEach((barChange) => {
    const bar = findBarInRows(rowManager.rows.value, barChange.barId)
    if (!bar) return

    emit("dragend-bar", {
      bar,
      e: new MouseEvent("mouseup"),
      movedBars: new Map([
        [
          bar,
          {
            oldStart: barChange.oldStart!,
            oldEnd: barChange.oldEnd!
          }
        ]
      ])
    })
  })

  updateBarPositions()
}

const handleKeyboardShortcuts = (e: KeyboardEvent) => {
  const isCtrlPressed = e.ctrlKey || e.metaKey
  if (isCtrlPressed && e.code === "KeyZ") {
    e.preventDefault()
    if (e.shiftKey) {
      if (rowManager.canRedo.value) {
        redo()
      }
    } else {
      if (rowManager.canUndo.value) {
        undo()
      }
    }
  }
}

// -----------------------------
// 10. LIFECYCLE HOOKS
// -----------------------------

// ResizeObserver instance
let resizeObserver: ResizeObserver

// Lifecycle Hooks
onMounted(() => {
  const cleanup = rowManager.onSortChange(updateBarPositions)
  const cleanupGroup = rowManager.onGroupExpansionChange(updateBarPositions)

  onUnmounted(cleanup)
  onUnmounted(cleanupGroup)
  if (ganttWrapper.value) {
    ganttWrapper.value.addEventListener("wheel", (e) => handleWheel(e, ganttWrapper.value!))
  }

  window.addEventListener("mousemove", handleTimeaxisMouseMove)
  window.addEventListener("mouseup", handleTimeaxisMouseUp)
  window.addEventListener("mousemove", (e) => handleResizeMove(e, handleSectionResize))
  window.addEventListener("mouseup", handleResizeEnd)
  window.addEventListener("keydown", handleKeyboardShortcuts)

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

  watch(scrollPosition, updateRangeBackground, { immediate: true })
})

onUnmounted(() => {
  if (ganttWrapper.value) {
    ganttWrapper.value.removeEventListener("wheel", (e) => handleWheel(e, ganttWrapper.value!))
  }

  window.removeEventListener("mousemove", handleTimeaxisMouseMove)
  window.removeEventListener("mouseup", handleTimeaxisMouseUp)
  window.removeEventListener("mousemove", (e) => handleResizeMove(e, handleSectionResize))
  window.removeEventListener("mouseup", handleResizeEnd)
  window.removeEventListener("keydown", handleKeyboardShortcuts)

  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  window.removeEventListener("resize", updateBarPositions)
})

// -----------------------------
// 11. WATCHERS
// -----------------------------
watch([() => props.chartStart, () => props.chartEnd], () => {
  updateBarPositions()
})

// -----------------------------
// 12. PROVIDERS
// -----------------------------

provide(CONFIG_KEY, {
  ...toRefs(props),
  colors,
  chartSize
})
provide(EMIT_BAR_EVENT_KEY, emitBarEvent)
provide(BOOLEAN_KEY, { ...props })
provide(GANTT_ID_KEY, id.value)
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
      <div class="g-gantt-main-layout" aria-controls="gantt-controls">
        <div v-if="labelColumnTitle" class="g-gantt-label-section" :style="labelSectionStyle">
          <!-- Label Column -->
          <g-gantt-label-column ref="labelColumn" @scroll="handleLabelScroll" @row-drop="dropRow">
            <template #label-column-title>
              <slot name="label-column-title" />
            </template>
            <template #label-column-row="slotProps">
              <slot name="label-column-row" v-bind="slotProps" />
            </template>
            <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
              <slot :name="name" v-bind="slotData" />
            </template>
          </g-gantt-label-column>
          <div
            class="g-gantt-section-resizer"
            @mousedown="(e) => handleResizeStart(e, labelSectionWidth)"
            @touchstart="(e) => handleTouchStart(e, labelSectionWidth)"
            @touchmove="(e) => handleTouchMove(e, handleSectionResize)"
            @touchend="resetResizeState"
            @touchcancel="resetResizeState"
          />
        </div>

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
              width: `${totalWidth}px`,
              background: colors.background,
              fontFamily: font
            }"
          >
            <!-- Timeaxis Component -->
            <g-gantt-timeaxis
              v-if="!hideTimeaxis"
              ref="timeaxisComponent"
              @drag-start="handleTimeaxisMouseDown"
              @touchstart="handleTimeaxisTouchStart"
              @touchmove="handleTimeaxisTouchMove"
              @touchend="handleTimeaxisTouchEnd"
              @touchcancel="handleTimeaxisTouchEnd"
              :timeaxisUnits="timeaxisUnits"
              :internalPrecision="internalPrecision"
            >
              <template #upper-timeunit="slotProps">
                <slot name="upper-timeunit" v-bind="slotProps" />
              </template>
              <template #timeunit="slotProps">
                <slot name="timeunit" v-bind="slotProps" />
              </template>
            </g-gantt-timeaxis>

            <!-- Optional Components -->
            <g-gantt-grid
              v-if="grid"
              :timeaxisUnits="timeaxisUnits"
              :internalPrecision="internalPrecision"
            />
            <g-gantt-current-time v-if="currentTime">
              <template #current-time-label>
                <slot name="current-time-label" />
              </template>
            </g-gantt-current-time>

            <g-gantt-milestone
              v-for="milestone in milestones"
              :key="milestone.date.toString()"
              :milestone="milestone"
            >
              <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
                <slot
                  :name="name"
                  v-bind="slotData"
                  v-if="(name as string).startsWith('milestone-') || name === 'milestone'"
                /> </template
            ></g-gantt-milestone>

            <!-- Rows Container -->
            <div
              class="g-gantt-rows-container"
              :style="rowsContainerStyle"
              ref="rowsContainer"
              @scroll="handleContentScroll"
            >
              <template v-for="row in rows" :key="row.id || row.label">
                <component :is="renderRow(row)" />
              </template>
              <!-- Connections -->
              <template v-if="enableConnections">
                <template v-for="conn in connections" :key="`${conn.sourceId}-${conn.targetId}`">
                  <g-gantt-connector
                    v-if="barPositions.get(conn.sourceId) && barPositions.get(conn.targetId)"
                    v-bind="getConnectorProps(conn)!"
                    :marker="markerConnection"
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
        <slot
          name="commands"
          :zoom-in="() => handleZoomUpdate(true)"
          :zoom-out="() => handleZoomUpdate(false)"
          :scroll-row-up="() => scrollRowUp()"
          :scroll-row-down="() => scrollRowDown()"
          :expand-all-groups="() => rowManager.expandAllGroups()"
          :collapse-all-groups="() => rowManager.collapseAllGroups()"
          :handle-to-start="() => handleStep(0, ganttWrapper!)"
          :handle-back="() => handleStep(scrollPosition - 10, ganttWrapper!)"
          :handle-scroll="() => handleScroll(ganttWrapper!)"
          :handle-forward="() => handleStep(scrollPosition + 10, ganttWrapper!)"
          :handle-to-end="() => handleStep(100, ganttWrapper!)"
          :undo="() => undo()"
          :redo="() => redo()"
          :can-undo="rowManager.canUndo"
          :can-redo="rowManager.canRedo"
          :is-at-top="isAtTop"
          :is-at-bottom="isAtBottom"
          :zoom-level="zoomLevel"
        >
          <div class="g-gantt-command-block">
            <!-- Navigation Controls -->
            <div class="g-gantt-command-vertical" v-if="maxRows > 0">
              <button @click="scrollRowUp" aria-label="Scroll row up" :disabled="isAtTop">
                <FontAwesomeIcon :icon="faAngleUp" class="command-icon" />
              </button>
              <button @click="scrollRowDown" aria-label="Scroll row down" :disabled="isAtBottom">
                <FontAwesomeIcon :icon="faAngleDown" class="command-icon" />
              </button>
            </div>
            <div class="g-gantt-command-groups" v-if="hasGroupRows">
              <button
                @click="rowManager.expandAllGroups()"
                aria-label="Expand all groups"
                :disabled="rowManager.areAllGroupsExpanded.value"
              >
                <FontAwesomeIcon :icon="faExpandAlt" class="command-icon" />
              </button>
              <button
                @click="rowManager.collapseAllGroups()"
                aria-label="Collapse all groups"
                :disabled="rowManager.areAllGroupsCollapsed.value"
              >
                <FontAwesomeIcon :icon="faCompressAlt" class="command-icon" />
              </button>
            </div>
          </div>

          <div class="g-gantt-command-fixed">
            <div class="g-gantt-command-slider">
              <button
                :disabled="scrollPosition === 0"
                @click="handleStep(0, ganttWrapper!)"
                aria-label="Scroll to start"
              >
                <FontAwesomeIcon :icon="faAnglesLeft" class="command-icon" />
              </button>
              <button
                :disabled="scrollPosition === 0"
                @click="handleStep(scrollPosition - 10, ganttWrapper!)"
                aria-label="Scroll back"
              >
                <FontAwesomeIcon :icon="faAngleLeft" class="command-icon" />
              </button>

              <!-- Position Slider -->
              <input
                v-model="scrollPosition"
                type="range"
                min="0"
                max="100"
                class="g-gantt-scroller"
                :style="{ '--value': `${scrollPosition}%` }"
                @input="handleScroll(ganttWrapper!)"
                :aria-valuemin="0"
                :aria-valuemax="100"
                :aria-valuenow="scrollPosition"
                aria-label="Gantt scroll position"
              />

              <button
                :disabled="scrollPosition === 100"
                @click="handleStep(scrollPosition + 10, ganttWrapper!)"
                aria-label="Scroll up"
              >
                <FontAwesomeIcon :icon="faAngleRight" class="command-icon" />
              </button>
              <button
                :disabled="scrollPosition === 100"
                @click="handleStep(100, ganttWrapper!)"
                aria-label="Scroll to end"
              >
                <FontAwesomeIcon :icon="faAnglesRight" class="command-icon" />
              </button>
            </div>
          </div>
          <div class="g-gantt-command-block">
            <!-- Zoom Controls -->
            <div class="g-gantt-command-zoom">
              <button
                @click="() => handleZoomUpdate(false)"
                aria-label="Zoom-out Gantt"
                :disabled="zoomLevel === 1 && internalPrecision === 'month'"
              >
                <FontAwesomeIcon :icon="faMagnifyingGlassMinus" class="command-icon" />
              </button>
              <button
                @click="() => handleZoomUpdate(true)"
                aria-label="Zoom-out Gantt"
                :disabled="zoomLevel === 10 && internalPrecision === precision"
              >
                <FontAwesomeIcon :icon="faMagnifyingGlassPlus" class="command-icon" />
              </button>
            </div>

            <div class="g-gantt-command-history">
              <button
                @click="undo"
                :disabled="!rowManager.canUndo.value"
                aria-label="Undo last action"
              >
                <FontAwesomeIcon :icon="faUndo" class="command-icon" />
              </button>
              <button @click="redo" :disabled="!rowManager.canRedo.value" aria-label="Redo action">
                <FontAwesomeIcon :icon="faRedo" class="command-icon" />
              </button>
            </div>
          </div>
        </slot>
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

.g-gantt-command-block {
  display: flex;
  gap: 8px;
}

.g-gantt-command-fixed,
.g-gantt-command-slider,
.g-gantt-command-vertical,
.g-gantt-command-zoom,
.g-gantt-command-history,
.g-gantt-command-groups {
  display: flex;
  align-items: center;
  gap: 2px;
}

.g-gantt-command-custom {
  flex-grow: 1;
}

.g-gantt-command-vertical button:disabled,
.g-gantt-command-slider button:disabled,
.g-gantt-command-zoom button:disabled,
.g-gantt-command-groups button:disabled,
.g-gantt-command-history button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media screen and (max-width: 768px) {
  .g-gantt-command {
    height: auto;
    min-height: unset;
    flex-direction: column;
    align-items: stretch;
    padding: 12px 6px;
    gap: 12px;
  }

  .g-gantt-command > * {
    width: 100%;
  }

  .g-gantt-command-block {
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .g-gantt-command-fixed {
    flex-direction: column;
    gap: 8px;
  }

  .g-gantt-command-groups {
    justify-content: center;
    margin-right: 0;
  }

  .g-gantt-command-slider {
    width: 100%;
    justify-content: center;
  }

  .g-gantt-command-vertical {
    flex-direction: row;
    justify-content: center;
  }

  .g-gantt-command-zoom,
  .g-gantt-command-history {
    justify-content: center;
  }

  /* Aumenta la dimensione dei pulsanti per una migliore interazione touch */
  .command-icon {
    padding: 8px;
    width: 16px;
    height: 16px;
  }

  /* Migliora la dimensione dello slider per dispositivi touch */
  .g-gantt-scroller {
    height: 12px;
  }

  .g-gantt-scroller::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }

  .g-gantt-scroller::-moz-range-thumb {
    width: 24px;
    height: 24px;
  }
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

.g-gantt-main-layout {
  display: flex;
  width: 100%;
  position: relative;
}

.g-gantt-label-section {
  position: relative;
  display: flex;
}

.g-gantt-section-resizer {
  position: absolute;
  right: -4px;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
  transition: background 0.2s ease;
}

.g-gantt-section-resizer:hover {
  background: rgba(0, 0, 0, 0.1);
}

.g-gantt-section-resizer:active {
  background: rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .g-gantt-section-resizer {
    width: 16px;
    right: -8px;
  }
}
</style>
