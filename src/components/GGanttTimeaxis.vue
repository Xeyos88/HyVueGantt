<template>
  <div
    ref="timeaxisElement"
    class="g-timeaxis"
    @mousedown="handleMouseDown"
    role="tablist"
    aria-label="Time Axis"
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
          flexDirection: precision === 'hour' ? 'column' : 'row',
          alignItems: precision === 'hour' ? '' : 'center',
          width
        }"
      >
        <slot name="timeunit" :label="label" :value="value" :date="date">
          {{ label }}
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
          flexDirection: precision === 'hour' ? 'column' : 'row',
          alignItems: precision === 'hour' ? '' : 'center',
          width
        }"
      >
        <slot name="timeunit" :label="label" :value="label" :date="date">
          {{ label }}
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
import { ref } from "vue"

const { precision, colors } = provideConfig()
const { enableMinutes } = provideBooleanConfig()
const { timeaxisUnits } = useTimeaxisUnits()

const emit = defineEmits<{
  (e: "dragStart", value: MouseEvent): void
  (e: "drag", value: MouseEvent): void
  (e: "dragEnd", value: MouseEvent): void
}>()

const timeaxisElement = ref<HTMLElement | null>(null)

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
</style>
