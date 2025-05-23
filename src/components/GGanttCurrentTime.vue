<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { computed, ref } from "vue"
import dayjs from "dayjs"
import { useIntervalFn } from "@vueuse/core"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------

// Composables
import useTimePositionMapping from "../composables/useTimePositionMapping"

// Provider
import provideConfig from "../provider/provideConfig"

// -----------------------------
// 3. INTERNAL STATE
// -----------------------------

/**
 * Time position mapping utility for converting time to x-coordinate
 */
const { mapTimeToPosition } = useTimePositionMapping()

/**
 * Current moment reference, updated by interval
 */
const currentMoment = ref(dayjs())

/**
 * Extract configuration from provider
 */
const { colors, dateFormat, currentTimeLabel, utc } = provideConfig()

/**
 * X-coordinate position for current time marker
 */
const xDist = ref()

// -----------------------------
// 4. TIME TRACKING FUNCTIONS
// -----------------------------

/**
 * Updates the current time and calculates its position
 * Called at regular intervals to keep the marker in sync with real time
 */
const loopTime = () => {
  const now = utc.value ? dayjs().utc() : dayjs()
  currentMoment.value = now

  const format = dateFormat.value || "YYYY-MM-DD HH:mm:ss"
  xDist.value = mapTimeToPosition(dayjs(currentMoment.value, format).format(format))
}

/**
 * Set up interval for updating current time
 */
useIntervalFn(loopTime, 1000)

// -----------------------------
// 5. COMPUTED PROPERTIES
// -----------------------------

/**
 * Display text for current time marker
 * Adds UTC indicator if UTC mode is enabled
 */
const currentTimeDisplay = computed(() => {
  if (utc.value) {
    return `${currentTimeLabel.value} (UTC)`
  }
  return currentTimeLabel.value
})
</script>

<template>
  <!-- Current time marker container -->
  <div
    class="g-grid-current-time"
    :style="{
      left: `${xDist}px`
    }"
  >
    <!-- Vertical line marker -->
    <div
      class="g-grid-current-time-marker"
      :style="{
        border: `1px dashed ${colors.markerCurrentTime}`
      }"
    />

    <!-- Time label -->
    <span class="g-grid-current-time-text" :style="{ color: colors.markerCurrentTime }">
      <slot name="current-time-label">
        {{ currentTimeDisplay }}
      </slot>
    </span>
  </div>
</template>

<style>
.g-grid-current-time {
  position: absolute;
  height: 100%;
  display: flex;
  z-index: 5;
  pointer-events: none;
}

.g-grid-current-time-marker {
  width: 0px;
  height: calc(100% - 2px);
  display: flex;
}

.g-grid-current-time-text {
  font-size: x-small;
}
</style>
