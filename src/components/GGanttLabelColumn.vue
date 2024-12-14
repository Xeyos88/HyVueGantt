<template>
  <div class="g-label-column" :style="{ fontFamily: font, color: colors.text }">
    <slot name="label-column-title">
      <div
        class="g-label-column-header"
        :style="{ background: colors.primary }"
        @click="handleSort"
        role="button"
        aria-label="Sort rows"
      >
        {{ labelColumnTitle }}
        <span v-if="sortDirection === 'asc'" class="sort-icon">
          <FontAwesomeIcon :icon="faArrowDownAZ" />
        </span>
        <span v-if="sortDirection === 'desc'" class="sort-icon">
          <FontAwesomeIcon :icon="faArrowDownZA" />
        </span>
      </div>
    </slot>
    <div
      class="g-label-column-rows"
      :style="labelContainerStyle"
      ref="labelContainer"
      @scroll="handleLabelScroll"
    >
      <div
        v-for="({ label }, index) in allRows"
        :key="`${label}_${index}`"
        class="g-label-column-row"
        :style="{
          background: index % 2 === 0 ? colors.ternary : colors.quartenary,
          height: `${rowHeight}px`
        }"
      >
        <slot name="label-column-row" :label="label">
          <span>{{ label }}</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import provideGetChartRows from "../provider/provideGetChartRows"
import provideConfig from "../provider/provideConfig"
import { ref, computed } from "vue"
import type { CSSProperties } from "vue"
import type { SortDirection } from "../types"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faArrowDownAZ, faArrowDownZA } from "@fortawesome/free-solid-svg-icons"

defineProps<{
  sortDirection?: SortDirection
}>()

const { font, colors, labelColumnTitle, rowHeight, maxRows } = provideConfig()

const getChartRows = provideGetChartRows()
const allRows = computed(() => getChartRows())
const labelContainer = ref<HTMLElement | null>(null)

const labelContainerStyle = computed<CSSProperties>(() => {
  if (maxRows.value === 0) return {}
  const minRows = Math.min(maxRows.value, allRows.value.length)

  return {
    height: `${minRows * rowHeight.value}px`,
    "overflow-y": "auto"
  }
})
const emit = defineEmits<{
  (e: "scroll", value: number): void
  (e: "sort"): void
}>()

const handleLabelScroll = (e: Event) => {
  const target = e.target as HTMLElement
  emit("scroll", target.scrollTop)
}

const handleSort = () => {
  emit("sort")
}

defineExpose({
  setScroll: (value: number) => {
    if (labelContainer.value) {
      labelContainer.value.scrollTop = value
    }
  }
})
</script>

<style>
.g-label-column {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: rgb(64, 64, 64);
  font-variant-numeric: tabular-nums;
  font-size: 0.9em;
}

.g-label-column-header {
  width: 100%;
  height: 80px;
  min-height: 80px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.g-label-column-rows {
  width: 100%;
  height: 100%;
  //display: flex;
  flex-direction: column;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.g-label-column-rows::-webkit-scrollbar {
  display: none;
}
.g-label-column-row {
  width: 100%;
  height: 100%;
  display: flex;
  padding: 0.1rem 0.3rem;
  overflow: hidden;
  white-space: normal;
  box-sizing: border-box;
  text-align: center;
  align-items: center;
  justify-content: center;
}

.sort-icon {
  margin-left: 0.25rem;
}
</style>
