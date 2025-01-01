<script setup lang="ts">
import provideConfig from "../provider/provideConfig"
import provideBooleanConfig from "../provider/provideBooleanConfig"
import useTimeaxisUnits from "../composables/useTimeaxisUnits"
import { ref } from "vue"

defineProps<{
  highlightedUnits?: number[]
}>()

const { colors } = provideConfig()
const { enableMinutes } = provideBooleanConfig()

const time = ref<HTMLElement | null>(null)

const { timeaxisUnits } = useTimeaxisUnits(time)

</script>

<template>
  <div class="g-grid-container" ref="time">
    <template v-if="!enableMinutes">
      <div
        v-for="({ label, width }, index) in timeaxisUnits.result.lowerUnits"
        :key="`${label}_${index}`"
        class="g-grid-line"
        :style="{
          width,
          background: highlightedUnits?.includes(Number(label)) ? colors.hoverHighlight : undefined
        }"
      />
    </template>
    <template v-else>
      <template  
      v-for="({ label, date, width }, index) in timeaxisUnits.result.lowerUnits"
      :key="`${label}_${index}`">
      <div
        v-for="step in timeaxisUnits.globalMinuteStep"
        :key="`${date}-${step}`"
        :class="step"
        class="g-grid-line step"
        :style="{
          width,
          background: highlightedUnits?.includes(Number(label)) ? colors.hoverHighlight : undefined
        }"
      /></template>
    </template>
  </div>
</template>

<style>
.g-grid-container {
  position: absolute;
  top: 0;
  left: 0%;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
}

.g-grid-line {
  width: 1px;
  height: 100%;
  border-left: 1px solid #eaeaea;
}
</style>
