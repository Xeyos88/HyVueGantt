<script setup lang="ts">
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import useTimeaxisUnits, { capitalizeWords } from "../composables/useTimeaxisUnits"
import { computed, ref, watch } from "vue"
import useDayjsHelper from "../composables/useDayjsHelper"
import type { TimeaxisUnit } from "@/types"
import GGanttHolidayTooltip from "./GGanttHolidayTooltip.vue"

const { precision, colors, chartSize, holidayHighlight, dayOptionLabel } = provideConfig()
const { chartStartDayjs, chartEndDayjs, toDayjs } = useDayjsHelper()
const totalHour = chartEndDayjs.value.diff(chartStartDayjs.value, "hour", true)

const timeaxisElement = ref<HTMLElement | null>(null)

const maxWidth = ref()
watch(
  () => chartSize.width.value,
  () => {
    if (chartSize.width.value / totalHour >= 12) {
      maxWidth.value = `${Math.floor(chartSize.width.value)}px`
    } else {
      maxWidth.value = `${totalHour * 12}px`
    }
  }
)

const { enableMinutes } = provideBooleanConfig()
const { timeaxisUnits, internalPrecision } = useTimeaxisUnits(timeaxisElement)

const emit = defineEmits<{
  (e: "dragStart", value: MouseEvent): void
  (e: "drag", value: MouseEvent): void
  (e: "dragEnd", value: MouseEvent): void
}>()

const handleMouseDown = (e: MouseEvent) => {
  emit("dragStart", e)
}

const dayUnitLevel = computed(() => {
  if (internalPrecision.value === "hour") {
    return "upper"
  } else if (internalPrecision.value === "day") {
    return "lower"
  }
  return null
})

const getHolidayStyle = (unit: TimeaxisUnit, unitType: "upper" | "lower") => {
  if (!holidayHighlight.value || dayUnitLevel.value !== unitType || !unit.isHoliday) {
    return {}
  }

  return {
    background: colors.value.holidayHighlight || "#ffebee"
  }
}

const hoveredUnit = ref<TimeaxisUnit | undefined>()
const showTooltip = ref(false)
const hoveredElement = ref<HTMLElement | null>(null)

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

const handleUnitMouseLeave = () => {
  showTooltip.value = false
  hoveredUnit.value = undefined
  hoveredElement.value = null
}

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

defineExpose({ timeaxisElement })
</script>

<template>
  <div
    ref="timeaxisElement"
    class="g-timeaxis"
    @mousedown="handleMouseDown"
    role="tablist"
    aria-label="Time Axis"
    :style="{ maxWidth: maxWidth }"
  >
    <div class="g-timeunits-container">
      <div
        v-for="(unit, index) in timeaxisUnits.result.upperUnits"
        :key="unit.label"
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
    <g-gantt-holiday-tooltip
      :model-value="showTooltip"
      :unit="hoveredUnit"
      :target-element="hoveredElement"
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
</style>
