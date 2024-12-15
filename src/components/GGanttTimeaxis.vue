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
        v-for="({ label, value, date, width }, index) in timeaxisUnits.upperUnits"
        :key="label"
        class="g-upper-timeunit"
        :style="{
          background: index % 2 === 0 ? colors.primary : colors.secondary,
          color: colors.text,
          width
        }"
      >
        <slot name="upper-timeunit" :label="label" :value="value" :date="date">
          {{ label }}
        </slot>
      </div>
    </div>

    <div class="g-timeunits-container">
      <div
        v-for="({ label, value, date, width }, index) in timeaxisUnits.lowerUnits"
        :key="label"
        class="g-timeunit"
        :style="{
          background: index % 2 === 0 ? colors.ternary : colors.quartenary,
          color: colors.text,
          flexDirection: precision === 'hour' ? 'row-reverse' : 'row',
          alignItems: 'center',
          width
        }"
      >
        <slot name="timeunit" :label="label" :value="value" :date="date">
          <div class="label-unit">{{ label }}</div>
        </slot>
        <div
          v-if="precision === 'hour'"
          class="g-timeaxis-hour-pin"
          :style="{ background: colors.text }"
        />
      </div>
    </div>
    <div v-if="precision === 'hour' && enableMinutes" class="g-timeunits-container">
      <div
        v-for="({ label, width, date }, index) in timeaxisUnits.minutesUnits"
        :key="`${label}-${index}`"
        class="g-timeunit"
        :style="{
          background: index % 2 === 0 ? colors.ternary : colors.quartenary,
          color: colors.text,
          flexDirection: precision === 'hour' ? 'row-reverse' : 'row',
          alignItems: 'center',
          width
        }"
      >
        <slot name="timeunit" :label="label" :value="label" :date="date">
          <div class="label-unit">{{ label }}</div>
        </slot>
        <div
          v-if="precision === 'hour'"
          class="g-timeaxis-hour-pin"
          :style="{ background: colors.text }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import useTimeaxisUnits from "../composables/useTimeaxisUnits"
import { ref, watch } from "vue"
import useDayjsHelper from "../composables/useDayjsHelper"
const { precision, colors, chartSize } = provideConfig()

const { chartStartDayjs, chartEndDayjs } = useDayjsHelper()
const totalHour = chartEndDayjs.value.diff(chartStartDayjs.value, "hour", true)

const timeaxisElement = ref<HTMLElement | null>(null)

const maxWidth = ref()
watch(
  () => chartSize.width.value,
  () => {
    console.log(chartSize.width.value)
    if (chartSize.width.value / totalHour >= 12) {
      maxWidth.value = `${Math.floor(chartSize.width.value)}px`
    } else {
      maxWidth.value = `${totalHour * 12}px`
    }
  }
)

const { enableMinutes } = provideBooleanConfig()
const { timeaxisUnits } = useTimeaxisUnits(timeaxisElement)

const emit = defineEmits<{
  (e: "dragStart", value: MouseEvent): void
  (e: "drag", value: MouseEvent): void
  (e: "dragEnd", value: MouseEvent): void
}>()

const handleMouseDown = (e: MouseEvent) => {
  emit("dragStart", e)
}

defineExpose({ timeaxisElement })
</script>

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
  flex-direction: column;
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
</style>
