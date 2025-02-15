<script setup lang="ts">
import { computed, ref } from "vue"
import useTimePositionMapping from "../composables/useTimePositionMapping"
import dayjs from "dayjs"
import provideConfig from "../provider/provideConfig"

import { useIntervalFn } from "@vueuse/core"

const { mapTimeToPosition } = useTimePositionMapping()
const currentMoment = ref(dayjs())
const { colors, dateFormat, currentTimeLabel, utc } = provideConfig()
const xDist = ref()

const loopTime = () => {
  const now = utc.value ? dayjs().utc() : dayjs()
  currentMoment.value = now
  const format = dateFormat.value || "YYYY-MM-DD HH:mm:ss"
  xDist.value = mapTimeToPosition(dayjs(currentMoment.value, format).format(format))
}
useIntervalFn(loopTime, 1000)

const currentTimeDisplay = computed(() => {
  if (utc.value) {
    return `${currentTimeLabel.value} (UTC)`
  }
  return currentTimeLabel.value
})
</script>

<template>
  <div
    class="g-grid-current-time"
    :style="{
      left: `${xDist}px`
    }"
  >
    <div
      class="g-grid-current-time-marker"
      :style="{
        border: `1px dashed ${colors.markerCurrentTime}`
      }"
    />
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
