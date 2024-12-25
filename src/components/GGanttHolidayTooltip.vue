<script setup lang="ts">
import { toRefs, ref, watch } from "vue"
import provideConfig from "../provider/provideConfig"
import type { TimeaxisUnit } from "../types"

const props = defineProps<{
  unit: TimeaxisUnit | undefined
  modelValue: boolean
  targetElement: HTMLElement | null
}>()

const { unit, targetElement } = toRefs(props)
const { font } = provideConfig()

const tooltipTop = ref("0px")
const tooltipLeft = ref("0px")

watch(
  [() => props.unit, () => props.targetElement],
  async () => {
    if (!unit.value?.holidayName || !targetElement.value) {
      return
    }

    const rect = targetElement.value.getBoundingClientRect()
    tooltipTop.value = `${rect.top - 30}px`
    tooltipLeft.value = `${rect.left + rect.width / 2}px`
  },
  { immediate: true }
)
</script>

<template>
  <teleport to="body">
    <transition name="g-fade" mode="out-in">
      <div
        v-if="modelValue && unit?.holidayName"
        class="g-gantt-holiday-tooltip"
        :style="{
          top: tooltipTop,
          left: tooltipLeft,
          fontFamily: font
        }"
      >
        <div class="g-gantt-holiday-tooltip-content">
          {{ unit.holidayName }}
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style>
.g-gantt-holiday-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  transform: translateX(-50%);
  white-space: nowrap;
}

.g-gantt-holiday-tooltip:after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(0, 0, 0, 0.8);
}

.g-fade-enter-active,
.g-fade-leave-active {
  transition: opacity 0.2s ease;
}

.g-fade-enter-from,
.g-fade-leave-to {
  opacity: 0;
}
</style>
