<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { computed, ref, toRefs } from "vue"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Provider
import provideConfig from "../provider/provideConfig"

// Utilities
import { capitalizeWords } from "../composables/useTimeaxisUnits"
import useDayjsHelper from "../composables/useDayjsHelper"
import { ganttWidth } from "../composables/useSimpleStore"

// Components
import GGanttHolidayTooltip from "./GGanttHolidayTooltip.vue"
import GGanttEventTooltip from "./GGanttEventTooltip.vue"

// Types
import type { TimeaxisData, TimeaxisUnit, TimeUnit, TimeaxisEvent } from "@/types"
import dayjs from "dayjs"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  timeaxisUnits: TimeaxisData
  internalPrecision: TimeUnit
}>()

const { timeaxisUnits, internalPrecision } = toRefs(props)

// Events emitted for timeaxis drag interactions
const emit = defineEmits<{
  (e: "dragStart", value: MouseEvent): void
  (e: "drag", value: MouseEvent): void
  (e: "dragEnd", value: MouseEvent): void
}>()

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------

// DOM references
const timeaxisElement = ref<HTMLElement | null>(null)

// Holiday tooltip state
const hoveredUnit = ref<TimeaxisUnit | undefined>()
const showTooltip = ref(false)
const hoveredElement = ref<HTMLElement | null>(null)

// Event tooltip state
const hoveredEvent = ref<TimeaxisEvent | undefined>()
const showEventTooltip = ref(false)
const hoveredEventElement = ref<HTMLElement | null>(null)

// -----------------------------
// 5. CONFIGURATION FROM PROVIDER
// -----------------------------
const {
  precision,
  colors,
  holidayHighlight,
  dayOptionLabel,
  enableMinutes,
  showEventsAxis,
  eventsAxisHeight
} = provideConfig()

// -----------------------------
// 6. HELPER FUNCTIONS
// -----------------------------
const { toDayjs } = useDayjsHelper()

/**
 * Handles mouse down events on the timeaxis
 * Initiates drag operation and emits appropriate event
 * @param e - Mouse event
 */
const handleMouseDown = (e: MouseEvent) => {
  emit("dragStart", e)
}

/**
 * Determines if a specific day unit level should be highlighted
 * Used to properly highlight holidays based on current precision
 */
const dayUnitLevel = computed(() => {
  if (internalPrecision.value === "hour") {
    return "upper"
  } else if (internalPrecision.value === "day") {
    return "lower"
  }
  return null
})

/**
 * Calculates the holiday highlight style for a time unit
 * @param unit - Timeaxis unit to style
 * @param unitType - Unit type (upper/lower)
 * @returns Style object for the unit
 */
const getHolidayStyle = (unit: TimeaxisUnit, unitType: "upper" | "lower") => {
  if (!holidayHighlight.value || dayUnitLevel.value !== unitType || !unit.isHoliday) {
    return {}
  }

  return {
    background: colors.value.holidayHighlight || "#ffebee"
  }
}

// -----------------------------
// 7. TOOLTIP HANDLING
// -----------------------------

/**
 * Handles mouse enter events on time units
 * Shows holiday tooltip when hovering over holiday units
 * @param unit - Timeaxis unit being hovered
 * @param unitType - Unit type (upper/lower)
 * @param event - Mouse event
 */
const handleUnitMouseEnter = (
  unit: TimeaxisUnit,
  unitType: "upper" | "lower",
  event: MouseEvent
) => {
  if (!holidayHighlight.value || dayUnitLevel.value === unitType || !unit.isHoliday) {
    hoveredUnit.value = unit
    hoveredElement.value = event.currentTarget as HTMLElement
    showTooltip.value = true
  }
}

/**
 * Handles mouse leave events on time units
 * Hides holiday tooltip
 */
const handleUnitMouseLeave = () => {
  showTooltip.value = false
  hoveredUnit.value = undefined
  hoveredElement.value = null
}

/**
 * Handles mouse enter events on event units
 * Shows event tooltip when hovering over events
 * @param event - Timeaxis event being hovered
 * @param mouseEvent - Mouse event
 */
const handleEventMouseEnter = (event: TimeaxisEvent, mouseEvent: MouseEvent) => {
  hoveredEvent.value = event
  hoveredEventElement.value = mouseEvent.currentTarget as HTMLElement
  showEventTooltip.value = true
}

/**
 * Handles mouse leave events on event units
 * Hides event tooltip
 */
const handleEventMouseLeave = () => {
  showEventTooltip.value = false
  hoveredEvent.value = undefined
  hoveredEventElement.value = null
}

// -----------------------------
// 8. DISPLAY FORMATTING
// -----------------------------

/**
 * Formats the label for a time unit based on configuration
 * @param unit - Timeaxis unit to format
 * @param unitType - Unit type (upper/lower)
 * @returns Formatted label string
 */
const formatTimeUnitLabel = (unit: TimeaxisUnit, unitType: "upper" | "lower") => {
  if (dayUnitLevel.value !== unitType || !dayOptionLabel.value) {
    return unit.label
  }

  let result = ""

  for (const option of dayOptionLabel.value) {
    if (result) result += " "

    switch (option) {
      case "day":
        result += unit.label
        break
      case "doy":
        result += `(${toDayjs(unit.date).dayOfYear()})`
        break
      case "name":
        result += capitalizeWords(toDayjs(unit.date).format("dd")[0]!)
        break
      case "number":
        result += toDayjs(unit.date).date()
        break
    }
  }

  return result
}

/**
 * Computed property for the height of the events axis
 * Returns the configured height or a default value
 */
const eventsAxisHeightValue = computed(() => {
  return eventsAxisHeight.value || 25
})

/**
 * Computed property for showing the events axis
 * Returns true if events axis should be shown and there are events
 */
const shouldShowEventsAxis = computed(() => {
  return showEventsAxis.value && timeaxisUnits.value.result.events.length > 0
})

const eventPositions = computed(() => {
  if (!timeaxisUnits.value.result.events.length) return []

  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper()
  const totalMinutes = chartEndDayjs.value.diff(chartStartDayjs.value, "minutes")

  return timeaxisUnits.value.result.events.map((event) => {
    const eventStartDayjs = dayjs(event.startDate)
    const eventEndDayjs = dayjs(event.endDate)

    const startTime = eventStartDayjs.isBefore(chartStartDayjs.value)
      ? chartStartDayjs.value
      : eventStartDayjs

    const endTime = eventEndDayjs.isAfter(chartEndDayjs.value) ? chartEndDayjs.value : eventEndDayjs

    const startMinutes = startTime.diff(chartStartDayjs.value, "minutes")
    const endMinutes = endTime.diff(chartStartDayjs.value, "minutes")

    const xPosition = (startMinutes / totalMinutes) * ganttWidth.value
    const width = Math.max(((endMinutes - startMinutes) / totalMinutes) * ganttWidth.value, 2)

    return {
      ...event,
      calculatedWidth: `${width}px`,
      calculatedX: xPosition
    }
  })
})

// Expose timeaxisElement reference to parent component
defineExpose({ timeaxisElement })
</script>

<template>
  <div
    ref="timeaxisElement"
    class="g-timeaxis"
    @mousedown="handleMouseDown"
    role="tablist"
    aria-label="Time Axis"
    :style="{
      borderBottom: `1px solid ${colors.gridAndBorder}`,
      height: shouldShowEventsAxis ? `${80 + eventsAxisHeightValue}px` : '80px'
    }"
  >
    <!-- Upper time units (months, years, etc.) -->
    <div class="g-timeunits-container">
      <div
        v-for="(unit, index) in timeaxisUnits.result.upperUnits"
        :key="unit.date.toISOString()"
        class="g-upper-timeunit"
        :style="{
          background: index % 2 === 0 ? colors.primary : colors.secondary,
          ...getHolidayStyle(unit, 'upper'),
          color: colors.text,
          width: unit.width
        }"
        @mouseenter="(e) => handleUnitMouseEnter(unit, 'upper', e)"
        @mouseleave="handleUnitMouseLeave"
      >
        <slot
          name="upper-timeunit"
          :label="formatTimeUnitLabel(unit, 'upper')"
          :value="unit.value"
          :date="unit.date"
        >
          {{ formatTimeUnitLabel(unit, "upper") }}
        </slot>
      </div>
    </div>
    <!-- Lower time units (days, hours, etc.) -->
    <div class="g-timeunits-container">
      <div
        v-for="(unit, index) in timeaxisUnits.result.lowerUnits"
        :key="unit.date.toISOString()"
        class="g-timeunit"
        :style="{
          background: index % 2 === 0 ? colors.ternary : colors.quartenary,
          ...getHolidayStyle(unit, 'lower'),
          color: colors.text,
          flexDirection: precision === 'hour' ? (enableMinutes ? 'column' : 'row-reverse') : 'row',
          alignItems: 'center',
          width: unit.width
        }"
        @mouseenter="(e) => handleUnitMouseEnter(unit, 'lower', e)"
        @mouseleave="handleUnitMouseLeave"
      >
        <!-- Main unit label -->
        <div class="g-timeunit-min">
          <slot
            name="timeunit"
            :label="formatTimeUnitLabel(unit, 'lower')"
            :value="unit.value"
            :date="unit.date"
          >
            <div class="label-unit">{{ formatTimeUnitLabel(unit, "lower") }}</div>
          </slot>
          <div
            v-if="precision === 'hour'"
            class="g-timeaxis-hour-pin"
            :style="{ background: colors.text }"
          />
        </div>
        <!-- Minutes subdivision for hourly precision -->
        <div v-if="precision === 'hour' && enableMinutes" class="g-timeunit-step">
          <div
            v-for="step in timeaxisUnits.globalMinuteStep"
            :key="`${unit.label}-${step}`"
            :style="{
              background: index % 2 === 0 ? colors.ternary : colors.quartenary,
              color: colors.text,
              display: 'flex',
              flexGrow: 1,
              flexDirection: 'row-reverse',
              alignItems: 'center'
            }"
          >
            <div class="label-unit">{{ step }}</div>
            <div class="g-timeaxis-hour-pin" :style="{ background: colors.text }" />
          </div>
        </div>
      </div>
    </div>
    <!-- Events axis (third level) -->
    <div
      v-if="shouldShowEventsAxis"
      class="g-events-container"
      :style="{
        height: `${eventsAxisHeightValue}px`,
        background: colors.background,
        borderTop: `1px solid ${colors.gridAndBorder}`
      }"
    >
      <div
        v-for="event in eventPositions"
        :key="event.id"
        class="g-timeaxis-event"
        :style="{
          left: `${event.xPosition}px`,
          width: event.width,
          backgroundColor: event.backgroundColor || colors.primary,
          color: event.color || colors.text,
          borderColor: event.color || colors.primary
        }"
        @mouseenter="(e) => handleEventMouseEnter(event, e)"
        @mouseleave="handleEventMouseLeave"
      >
        <slot name="timeaxis-event" :event="event">
          {{ event.label }}
        </slot>
      </div>
    </div>
    <!-- Holiday tooltip -->
    <g-gantt-holiday-tooltip
      :model-value="showTooltip"
      :unit="hoveredUnit"
      :target-element="hoveredElement"
    />
    <!-- Event tooltip -->
    <g-gantt-event-tooltip
      :model-value="showEventTooltip"
      :event="hoveredEvent"
      :target-element="hoveredEventElement"
    />
  </div>
</template>

<style>
.g-timeaxis {
  position: sticky;
  top: 0;
  width: 100%;
  height: 80px;
  background: white;
  z-index: 4;
  display: flex;
  flex-direction: column;
  cursor: grab;
}

.g-timeaxis:active {
  cursor: grabbing;
}

.g-timeunits-container {
  display: flex;
  width: 100%;
  height: 50%;
}

.g-timeunit {
  height: 100%;
  font-size: 65%;
  display: flex;
  justify-content: center;
}

.g-upper-timeunit {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.g-timeaxis-hour-pin {
  width: 1px;
  height: 10px;
}

.label-unit {
  flex-grow: 1;
  text-align: center;
  line-height: normal;
}

.g-timeunit-min {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  width: 100%;
  line-height: 20px;
}

.g-timeunit-step {
  display: flex;
  width: 100%;
  line-height: 20px;
}

.g-events-container {
  display: flex;
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.g-timeaxis-event {
  position: absolute;
  height: calc(100% - 6px);
  top: 3px;
  border-radius: 3px;
  font-size: 65%;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid;
  box-sizing: border-box;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.g-timeaxis-event:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 5;
}
</style>
