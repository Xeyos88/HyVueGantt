<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { ref, computed, inject } from "vue"
import { useMouseInElement, watchThrottled } from "@vueuse/core"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Composables
import type { UseRowsReturn } from "../composables/useRows"
import useTimePositionMapping from "../composables/useTimePositionMapping"
import useDayjsHelper from "../composables/useDayjsHelper"

// Types and Constants
import type { GanttBarObject } from "../types"
import { CHART_AREA_KEY, CHART_AREA_WRAPPER_KEY } from "../provider/symbols"

// Providers
import provideConfig from "../provider/provideConfig"

// -----------------------------
// 4. INTERNAL STATE
// -----------------------------

// Component Refs
const chartAreaEl = inject(CHART_AREA_KEY)
const chartWrapperEl = inject(CHART_AREA_WRAPPER_KEY)
const hitBars = ref<GanttBarObject[]>([])

// -----------------------------
// 5. COMPOSABLES & PROVIDERS
// -----------------------------

const { colors, pointerMarkerLabel, barStart, barEnd } = provideConfig()
const { mapPositionToTime } = useTimePositionMapping()
const rowManager = inject<UseRowsReturn>("useRows")!
const { toDayjs } = useDayjsHelper()

// Mouse / pointer tracker
const { elementX } = useMouseInElement(chartAreaEl)
const { isOutside, elementY } = useMouseInElement(chartWrapperEl)

// -----------------------------
// 6. COMPUTED PROPERTIES
// -----------------------------

const leftOffset = computed<number>((prev) => isOutside.value ? (prev ?? 0) : elementX.value)
const datetime = computed(() => mapPositionToTime(leftOffset.value))

// -----------------------------
// 11. WATCHERS
// -----------------------------

watchThrottled(leftOffset, () => {
  // Ideally this can be a reactive computed value. Need to measure when having big dataset
  const bars = rowManager.getFlattenedRows().flatMap(row => row.bars)
  const hitBarsElement = []
  const cursorTime = toDayjs(datetime.value)
  for (let i = 0; i < bars.length; i++) {
    const element = bars[i]!;
    const begin = toDayjs(element[barStart.value])
    const end = toDayjs(element[barEnd.value])
    if (cursorTime.isBetween(begin, end)) {
      hitBarsElement.push(element)
    }
  }
  hitBars.value = hitBarsElement
}, { throttle: 200 })
</script>

<template>
  <div class="g-grid-pointer-marker-container" :style="{
    left: `${leftOffset}px`
  }">
    <!-- Alternative is to make it fixed in the chart somewhere like a legend -->
    <div class="g-grid-pointer-marker-tooltips" :style="{ top: `${elementY}px` }">
      <slot name="pointer-marker-tooltips" v-bind="{ hitBars }">
        <!-- Just to demonstrate the capabilities -->
        <div style="display: flex; flex-direction: column;" :style="{ backgroundColor: `${colors.toast}` }">
          <span v-for="bar in hitBars" :key="bar.ganttBarConfig.id">Task ID: {{ bar.ganttBarConfig.id }}</span>
        </div>
      </slot>
    </div>
    <div class="g-grid-pointer-marker-marker" :style="{
      border: `1px dashed ${colors.markerCurrentTime}`
    }" />
    <span class="g-grid-pointer-marker-text" :style="{ color: colors.markerCurrentTime }">
      <slot name="pointer-marker-label" v-bind="{ datetime }">
        {{ pointerMarkerLabel }} {{ datetime }}
      </slot>
    </span>
  </div>
</template>

<style>
.g-grid-pointer-marker-container {
  position: absolute;
  height: 100%;
  display: flex;
  z-index: 5;
  pointer-events: none;
}

.g-grid-pointer-marker-tooltips {
  position: absolute;
}

.g-grid-pointer-marker-marker {
  width: 0px;
  height: calc(100% - 2px);
  display: flex;
}

.g-grid-pointer-marker-text {
  font-size: x-small;
}
</style>
