<script setup lang="ts">
import { computed } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faAnglesLeft,
  faAngleLeft,
  faAngleRight,
  faAnglesRight,
  faAngleUp,
  faAngleDown,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faExpandAlt,
  faCompressAlt,
  faUndo,
  faRedo,
  faFileExport,
  faSpinner
} from "@fortawesome/free-solid-svg-icons"
import type { ColorScheme } from "../types"
import type { UseRowsReturn } from "../composables/useRows"

// Props interface
interface Props {
  colors: ColorScheme
  font: string
  maxRows: number
  hasGroupRows: boolean
  isAtTop: boolean
  isAtBottom: boolean
  zoomLevel: number
  internalPrecision: string
  precision: string
  scrollPosition: number
  exportEnabled: boolean
  isExporting: boolean
  selectedExportFormat: string
  rowManager: UseRowsReturn
  export?: (format?: string) => Promise<void>
}

// Emits interface
interface Emits {
  (e: 'scrollRowUp'): void
  (e: 'scrollRowDown'): void
  (e: 'expandAllGroups'): void
  (e: 'collapseAllGroups'): void
  (e: 'handleToStart'): void
  (e: 'handleBack'): void
  (e: 'handleScroll'): void
  (e: 'handleForward'): void
  (e: 'handleToEnd'): void
  (e: 'zoomOut'): void
  (e: 'zoomIn'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'triggerExport'): void
  (e: 'update:selectedExportFormat', value: string): void
  (e: 'update:scrollPosition', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state for export format
const localExportFormat = computed({
  get: () => props.selectedExportFormat,
  set: (value: string) => emit('update:selectedExportFormat', value)
})

// Local state for scroll position
const localScrollPosition = computed({
  get: () => props.scrollPosition,
  set: (value: number) => emit('update:scrollPosition', value)
})

// Command handlers
const handleScrollRowUp = () => emit('scrollRowUp')
const handleScrollRowDown = () => emit('scrollRowDown')
const handleExpandAllGroups = () => emit('expandAllGroups')
const handleCollapseAllGroups = () => emit('collapseAllGroups')
const handleToStart = () => emit('handleToStart')
const handleBack = () => emit('handleBack')
const handleScroll = () => emit('handleScroll')
const handleForward = () => emit('handleForward')
const handleToEnd = () => emit('handleToEnd')
const handleZoomOut = () => emit('zoomOut')
const handleZoomIn = () => emit('zoomIn')
const handleUndo = () => emit('undo')
const handleRedo = () => emit('redo')
const handleTriggerExport = (format?: string) => {
  if (format) {
    // Se viene passato un formato specifico, possiamo solo emettere l'evento
    // Il gestore dovrebbe essere modificato per gestire il formato
    emit('triggerExport')
  } else {
    emit('triggerExport')
  }
}
</script>

<template>
  <div
    class="g-gantt-command"
    :style="{ background: colors.commands, fontFamily: font }"
    aria-label="Gantt Commands"
  >
    <slot
      name="commands"
      :zoom-in="handleZoomIn"
      :zoom-out="handleZoomOut"
      :scroll-row-up="handleScrollRowUp"
      :scroll-row-down="handleScrollRowDown"
      :expand-all-groups="handleExpandAllGroups"
      :collapse-all-groups="handleCollapseAllGroups"
      :handle-to-start="handleToStart"
      :handle-back="handleBack"
      :handle-scroll="handleScroll"
      :handle-forward="handleForward"
      :handle-to-end="handleToEnd"
      :undo="handleUndo"
      :redo="handleRedo"
      :can-undo="rowManager.canUndo"
      :can-redo="rowManager.canRedo"
      :is-at-top="isAtTop"
      :is-at-bottom="isAtBottom"
      :zoom-level="zoomLevel"
      :export="props.export || handleTriggerExport"
    >
      <div class="g-gantt-command-block">
        <!-- Navigation Controls -->
        <div class="g-gantt-command-vertical" v-if="maxRows > 0">
          <button @click="handleScrollRowUp" aria-label="Scroll row up" :disabled="isAtTop">
            <FontAwesomeIcon :icon="faAngleUp" class="command-icon" />
          </button>
          <button @click="handleScrollRowDown" aria-label="Scroll row down" :disabled="isAtBottom">
            <FontAwesomeIcon :icon="faAngleDown" class="command-icon" />
          </button>
        </div>
        <div class="g-gantt-command-groups" v-if="hasGroupRows">
          <button
            @click="handleExpandAllGroups"
            aria-label="Expand all groups"
            :disabled="rowManager.areAllGroupsExpanded.value"
          >
            <FontAwesomeIcon :icon="faExpandAlt" class="command-icon" />
          </button>
          <button
            @click="handleCollapseAllGroups"
            aria-label="Collapse all groups"
            :disabled="rowManager.areAllGroupsCollapsed.value"
          >
            <FontAwesomeIcon :icon="faCompressAlt" class="command-icon" />
          </button>
        </div>
      </div>

      <div class="g-gantt-command-fixed">
        <div class="g-gantt-command-slider">
          <button
            :disabled="scrollPosition === 0"
            @click="handleToStart"
            aria-label="Scroll to start"
          >
            <FontAwesomeIcon :icon="faAnglesLeft" class="command-icon" />
          </button>
          <button
            :disabled="scrollPosition === 0"
            @click="handleBack"
            aria-label="Scroll back"
          >
            <FontAwesomeIcon :icon="faAngleLeft" class="command-icon" />
          </button>

          <!-- Position Slider -->
          <input
            v-model="localScrollPosition"
            type="range"
            min="0"
            max="100"
            class="g-gantt-scroller"
            :style="{ '--value': `${scrollPosition}%` }"
            @input="handleScroll"
            :aria-valuemin="0"
            :aria-valuemax="100"
            :aria-valuenow="scrollPosition"
            aria-label="Gantt scroll position"
          />

          <button
            :disabled="scrollPosition === 100"
            @click="handleForward"
            aria-label="Scroll up"
          >
            <FontAwesomeIcon :icon="faAngleRight" class="command-icon" />
          </button>
          <button
            :disabled="scrollPosition === 100"
            @click="handleToEnd"
            aria-label="Scroll to end"
          >
            <FontAwesomeIcon :icon="faAnglesRight" class="command-icon" />
          </button>
        </div>
      </div>
      <div class="g-gantt-command-block">
        <!-- Zoom Controls -->
        <div class="g-gantt-command-zoom">
          <button
            @click="handleZoomOut"
            aria-label="Zoom-out Gantt"
            :disabled="zoomLevel === 1 && internalPrecision === 'month'"
          >
            <FontAwesomeIcon :icon="faMagnifyingGlassMinus" class="command-icon" />
          </button>
          <button
            @click="handleZoomIn"
            aria-label="Zoom-in Gantt"
            :disabled="zoomLevel === 10 && internalPrecision === precision"
          >
            <FontAwesomeIcon :icon="faMagnifyingGlassPlus" class="command-icon" />
          </button>
        </div>

        <div class="g-gantt-command-history">
          <button
            @click="handleUndo"
            :disabled="!rowManager.canUndo.value"
            aria-label="Undo last action"
          >
            <FontAwesomeIcon :icon="faUndo" class="command-icon" />
          </button>
          <button @click="handleRedo" :disabled="!rowManager.canRedo.value" aria-label="Redo action">
            <FontAwesomeIcon :icon="faRedo" class="command-icon" />
          </button>
        </div>
      </div>
      <div class="g-gantt-command-block">
        <div class="g-gantt-command-export" v-if="exportEnabled">
          <div class="g-gantt-export-container">
            <select
              v-model="localExportFormat"
              class="g-gantt-export-select"
              :disabled="isExporting"
            >
              <option value="" disabled>Export</option>
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
              <option value="excel">Excel</option>
            </select>
            <button @click="() => handleTriggerExport()" :disabled="!selectedExportFormat || isExporting">
              <FontAwesomeIcon :icon="faFileExport" class="command-icon" />
              <span v-if="isExporting" class="g-gantt-export-loading">
                <FontAwesomeIcon :icon="faSpinner" class="fa-spin" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.g-gantt-command {
  display: flex;
  align-items: center;
  height: 40px;
  border-top: 1px solid #eaeaea;
  padding: 0px 6px;
  gap: 8px;
}

.g-gantt-command-block {
  display: flex;
  gap: 8px;
}

.g-gantt-command-fixed,
.g-gantt-command-slider,
.g-gantt-command-vertical,
.g-gantt-command-zoom,
.g-gantt-command-history,
.g-gantt-command-groups,
.g-gantt-export-container {
  display: flex;
  align-items: center;
  gap: 2px;
}

.g-gantt-command-vertical button:disabled,
.g-gantt-command-slider button:disabled,
.g-gantt-command-zoom button:disabled,
.g-gantt-command-groups button:disabled,
.g-gantt-command-history button:disabled,
.g-gantt-export-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.g-gantt-export-select {
  border-radius: 4px;
  font-size: 0.75rem;
  padding-inline: 2px;
  padding-block: 0;
  height: 22px;
}

.g-gantt-export-loading {
  margin-left: 4px;
}

@media screen and (max-width: 768px) {
  .g-gantt-command {
    height: auto;
    min-height: unset;
    flex-direction: column;
    align-items: stretch;
    padding: 12px 6px;
    gap: 12px;
  }

  .g-gantt-command > * {
    width: 100%;
  }

  .g-gantt-command-block {
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .g-gantt-command-fixed {
    flex-direction: column;
    gap: 8px;
  }

  .g-gantt-command-groups {
    justify-content: center;
    margin-right: 0;
  }

  .g-gantt-command-slider {
    width: 100%;
    justify-content: center;
  }

  .g-gantt-command-vertical {
    flex-direction: row;
    justify-content: center;
  }

  .g-gantt-command-zoom,
  .g-gantt-command-history {
    justify-content: center;
  }

  .g-gantt-command-export {
    display: flex;
    align-items: center;
  }

  .command-icon {
    padding: 8px;
    width: 16px;
    height: 16px;
  }

  .g-gantt-scroller {
    height: 12px;
  }

  .g-gantt-scroller::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }

  .g-gantt-scroller::-moz-range-thumb {
    width: 24px;
    height: 24px;
  }
}

.g-gantt-scroller {
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  outline: none;
  background: linear-gradient(
    to right,
    v-bind(colors.rangeHighlight) var(--value),
    #ddd var(--value)
  );
}

.g-gantt-scroller::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: v-bind(colors.rangeHighlight);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.g-gantt-scroller::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: v-bind(colors.rangeHighlight);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.g-gantt-scroller::-moz-range-track {
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  border: none;
}

.g-gantt-scroller::-webkit-slider-thumb:hover,
.g-gantt-scroller::-moz-range-thumb:hover {
  background: v-bind(colors.rangeHighlight);
}

.command-icon {
  background: v-bind(colors.rangeHighlight);
  padding: 4px;
  margin: 2px;
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

button {
  display: flex;
  padding: 0;
  background-color: transparent;
  background-image: none;
  border: 0;
  color: v-bind(colors.text);
}
</style>