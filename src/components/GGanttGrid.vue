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

const time = ref(null)

const { timeaxisUnits } = useTimeaxisUnits(time)
</script>

<template>
  <div class="g-grid-container">
    <template v-if="!enableMinutes">
      <div
        v-for="{ label, value, width } in timeaxisUnits.result.lowerUnits"
        :key="label"
        class="g-grid-line"
        :style="{
          width,
          background: highlightedUnits?.includes(Number(value)) ? colors.hoverHighlight : undefined
        }"
      />
    </template>
    <template v-else>
      <div
        v-for="({ label, width }, index) in timeaxisUnits.result.minutesUnits"
        :key="`${label}-${index}`"
        class="g-grid-line"
        :style="{
          width,
          background: highlightedUnits?.includes(Number(label)) ? colors.hoverHighlight : undefined
        }"
      />
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
