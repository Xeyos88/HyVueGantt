<script setup lang="ts">
import { computed, ref, toRefs, watch, onMounted, inject } from "vue"

import useBarDragManagement from "../composables/useBarDragManagement"
import useTimePositionMapping from "../composables/useTimePositionMapping"
import useBarDragLimit from "../composables/useBarDragLimit"
import { useBarKeyboardControl } from "../composables/useBarKeyboardControl"
import { useTouchEvents } from "../composables/useTouchEvents"
import type { GanttBarObject } from "../types"
import provideEmitBarEvent from "../provider/provideEmitBarEvent"
import provideConfig from "../provider/provideConfig"
import { BAR_CONTAINER_KEY } from "../provider/symbols"

const props = defineProps<{
  bar: GanttBarObject
}>()

const emitBarEvent = provideEmitBarEvent()
const config = provideConfig()
const { rowHeight } = config

const { bar } = toRefs(props)
const { mapTimeToPosition, mapPositionToTime } = useTimePositionMapping()
const { initDragOfBar, initDragOfBundle } = useBarDragManagement()
const { setDragLimitsOfGanttBar } = useBarDragLimit()

const isDragging = ref(false)

const barConfig = computed(() => bar.value.ganttBarConfig)

const { onBarKeyDown } = useBarKeyboardControl(bar.value, config, emitBarEvent)

function firstMousemoveCallback(e: MouseEvent) {
  if (barConfig.value.bundle != null) {
    initDragOfBundle(bar.value, e)
  } else {
    initDragOfBar(bar.value, e)
  }
  isDragging.value = true
}

const prepareForDrag = () => {
  setDragLimitsOfGanttBar(bar.value)
  if (barConfig.value.immobile) {
    return
  }

  window.addEventListener("mousemove", firstMousemoveCallback, {
    once: true
  })
  window.addEventListener(
    "mouseup",
    () => {
      window.removeEventListener("mousemove", firstMousemoveCallback)
      isDragging.value = false
    },
    { once: true }
  )
}

const barContainerEl = inject(BAR_CONTAINER_KEY)

const onMouseEvent = (e: MouseEvent) => {
  e.preventDefault()
  if (e.type === "mousedown") {
    prepareForDrag()
  }
  const barContainer = barContainerEl?.value?.getBoundingClientRect()
  if (!barContainer) {
    return
  }
  const datetime = mapPositionToTime(e.clientX - barContainer.left)
  emitBarEvent(e, bar.value, datetime)
}

const { barStart, barEnd, width, chartStart, chartEnd, chartSize } = config

const xStart = ref(0)
const xEnd = ref(0)

const { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } = useTouchEvents(
  (_draggedBar, e) => {
    firstMousemoveCallback(e)
    isDragging.value = true
  }
)
const onTouchEvent = (e: TouchEvent) => {
  console.log(e)
  if (bar.value.ganttBarConfig.immobile) return

  let mouseEvent: MouseEvent | undefined

  switch (e.type) {
    case "touchstart":
      mouseEvent = handleTouchStart(e, bar.value)!
      break
    case "touchmove":
      mouseEvent = handleTouchMove(e)!
      break
    case "touchend":
      mouseEvent = handleTouchEnd(e)!
      break
    case "touchcancel":
      mouseEvent = handleTouchCancel(e)!
      break
  }

  if (mouseEvent) {
    onMouseEvent(mouseEvent)
  }
}

onMounted(() => {
  xStart.value = mapTimeToPosition(bar.value[barStart.value])
  xEnd.value = mapTimeToPosition(bar.value[barEnd.value])

  watch(
    [() => bar.value, width, chartStart, chartEnd, chartSize.width],
    () => {
      const newXStart = mapTimeToPosition(bar.value[barStart.value])
      const newXEnd = mapTimeToPosition(bar.value[barEnd.value])

      xStart.value = newXStart
      xEnd.value = newXEnd
    },
    { deep: true, immediate: true }
  )
})
const isGroupBar = computed(() => {
  return bar.value.ganttBarConfig.id.startsWith("group-")
})

const getGroupBarPath = (width: number, height: number) => {
  const mainBarHeight = height * 0.5

  return `
    M 0 0
    L 0 ${height}
    L ${15} ${mainBarHeight}
    L ${width - 15} ${mainBarHeight}
    L ${width} ${height}
    L ${width} 0
    L 0 0
  `
}
</script>

<template>
  <div
    :id="barConfig.id"
    :class="['g-gantt-bar', barConfig.class || '']"
    :style="{
      ...barConfig.style,
      position: 'absolute',
      top: `${rowHeight * 0.15}px`,
      left: `${xStart}px`,
      width: `${xEnd - xStart}px`,
      height: `${rowHeight * 0.7}px`,
      zIndex: isDragging ? 3 : 2,
      cursor: bar.ganttBarConfig.immobile ? '' : 'grab'
    }"
    @mousedown="onMouseEvent"
    @click="onMouseEvent"
    @dblclick="onMouseEvent"
    @mouseenter="onMouseEvent"
    @mouseleave="onMouseEvent"
    @contextmenu="onMouseEvent"
    @touchstart="onTouchEvent"
    @touchmove="onTouchEvent"
    @touchend="onTouchEvent"
    @touchcancel="onTouchEvent"
    @keydown="onBarKeyDown"
    role="listitem"
    :aria-label="`Activity ${barConfig.label}`"
    :aria-grabbed="isDragging"
    tabindex="0"
    :aria-describedby="`tooltip-${barConfig.id}`"
  >
    <svg
      v-if="isGroupBar"
      class="group-bar-decoration"
      :width="xEnd - xStart"
      :height="rowHeight * 0.7"
    >
      <path
        :d="getGroupBarPath(xEnd - xStart, rowHeight * 0.65)"
        :fill="config.colors.value.barContainer"
      />
    </svg>
    <div class="g-gantt-bar-label">
      <slot :bar="bar">
        <div v-if="!isGroupBar">
          {{ barConfig.label || "" }}
        </div>
        <div v-if="barConfig.html" v-html="barConfig.html" />
      </slot>
    </div>
    <template v-if="barConfig.hasHandles">
      <div class="g-gantt-bar-handle-left" />
      <div class="g-gantt-bar-handle-right" />
    </template>
  </div>
</template>

<style>
.g-gantt-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  background: cadetblue;
  overflow: hidden;
}

.g-gantt-bar-label {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0 14px 0 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.g-gantt-bar-label > * {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.g-gantt-bar-handle-left,
.g-gantt-bar-handle-right {
  position: absolute;
  width: 10px;
  height: 100%;
  background: white;
  opacity: 0.7;
  border-radius: 0px;
  cursor: ew-resize;
  top: 0;
}
.g-gantt-bar-handle-left {
  left: 0;
}
.g-gantt-bar-handle-right {
  right: 0;
}

.g-gantt-bar-label img {
  pointer-events: none;
}

.is-group-bar {
  background: transparent !important;
}

.group-bar-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
