<script setup lang="ts">
import { ref, computed } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

const commandsStyle = ref('default')
const showZoom = ref(true)
const showNavigation = ref(true)
const showHistory = ref(true)

const commandsClasses = computed(() => ({
  'custom-commands': true,
  'custom-commands-modern': commandsStyle.value === 'modern',
  'custom-commands-minimal': commandsStyle.value === 'minimal'
}))

const rows = ref([
  {
    label: 'Task Group 1',
    id: 'group1',
    children: [
      {
        id: 'task1',
        label: 'Task 1',
        bars: [{
          start: '2024-01-15',
          end: '2024-01-20',
          ganttBarConfig: {
            id: 'A1',
            label: 'Development',
            style: { background: '#42b883' }
          }
        }]
      },
      {
        id: 'task2',
        label: 'Task 2',
        bars: [{
          start: '2024-01-18',
          end: '2024-01-25',
          ganttBarConfig: {
            id: 'A2',
            label: 'Testing',
            style: { background: '#35495e' }
          }
        }]
      }
    ]
  },
  {
    label: 'Task Group 2',
    id: 'group2',
    children: [
      {
        id: 'task3',
        label: 'Task 3',
        bars: [{
          start: '2024-01-22',
          end: '2024-01-28',
          ganttBarConfig: {
            id: 'A3',
            label: 'Design',
            style: { background: '#ff7e67' }
          }
        }]
      },
      {
        id: 'task4',
        label: 'Task 4',
        bars: [{
          start: '2024-01-25',
          end: '2024-02-01',
          ganttBarConfig: {
            id: 'A4',
            label: 'Review',
            style: { background: '#ffcc80' }
          }
        }]
      }
    ]
  }
])
</script>

<template>
  <div class="demo-container">
    <div class="controls">
      <label class="control-item">
        <span>Style:</span>
        <select v-model="commandsStyle">
          <option value="default">Default</option>
          <option value="modern">Modern</option>
          <option value="minimal">Minimal</option>
        </select>
      </label>
      
      <label class="control-item">
        <input type="checkbox" v-model="showZoom">
        Show Zoom Controls
      </label>
      
      <label class="control-item">
        <input type="checkbox" v-model="showNavigation">
        Show Navigation
      </label>
      
      <label class="control-item">
        <input type="checkbox" v-model="showHistory">
        Show History
      </label>
    </div>

    <g-gantt-chart
      chart-start="2024-01-15"
      chart-end="2024-02-15"
      precision="day"
      bar-start="start"
      bar-end="end"
      grid
      :commands="true"
    >
      <template #commands="{
        zoomIn,
        zoomOut,
        scrollRowUp,
        scrollRowDown,
        expandAllGroups,
        collapseAllGroups,
        handleToStart,
        handleBack,
        handleForward,
        handleToEnd,
        undo,
        redo,
        canUndo,
        canRedo,
        isAtTop,
        isAtBottom,
        zoomLevel
      }">
        <div :class="commandsClasses">
          <template v-if="showZoom">
            <div class="command-group">
              <span class="command-label">Zoom</span>
              <button class="command-button" @click="zoomOut" :disabled="zoomLevel === 1">-</button>
              <span>{{ zoomLevel }}x</span>
              <button class="command-button" @click="zoomIn" :disabled="zoomLevel === 10">+</button>
            </div>
          </template>

          <template v-if="showNavigation">
            <div class="command-group">
              <span class="command-label">Navigation</span>
              <button class="command-button" @click="handleToStart">⟪</button>
              <button class="command-button" @click="handleBack">⟨</button>
              <button class="command-button" @click="handleForward">⟩</button>
              <button class="command-button" @click="handleToEnd">⟫</button>
            </div>

            <div class="command-group">
              <span class="command-label">Rows</span>
              <button class="command-button" @click="scrollRowUp" :disabled="isAtTop">↑</button>
              <button class="command-button" @click="scrollRowDown" :disabled="isAtBottom">↓</button>
            </div>

            <div class="command-group">
              <span class="command-label">Groups</span>
              <button class="command-button" @click="expandAllGroups">Expand</button>
              <button class="command-button" @click="collapseAllGroups">Collapse</button>
            </div>
          </template>

          <template v-if="showHistory">
            <div class="command-group">
              <span class="command-label">History</span>
              <button class="command-button" @click="undo" :disabled="!canUndo">Undo</button>
              <button class="command-button" @click="redo" :disabled="!canRedo">Redo</button>
            </div>
          </template>
        </div>
      </template>

      <g-gantt-row
        v-for="row in rows"
        :key="row.id"
        :id="row.id"
        :label="row.label"
        :bars="row.bars"
        :children="row.children"
        highlightOnHover
      />
    </g-gantt-chart>
  </div>
</template>

<style scoped>
.demo-container {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-item select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #eaeaea;
}

.control-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

/* Base Commands Styles */
.custom-commands {
  display: flex;
  gap: 10px;
  padding: 8px;
}

.command-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.command-button {
  padding: 2px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
  font-size: 10px;
}

.command-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.command-label {
  font-size: 0.8em;
  color: #666;
}

/* Modern Style */
.custom-commands-modern {
  background: #f8f9fa;
  border-radius: 8px;
  margin: 4px;
  gap: 20px;
}

.custom-commands-modern .command-group {
  padding: 4px 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  gap: 8px;
}

.custom-commands-modern .command-button {
  background: #42b883;
  color: white;
  border: none;
}

.custom-commands-modern .command-label {
  color: #444;
}

/* Minimal Style */
.custom-commands-minimal {
  padding: 4px;
}

.custom-commands-minimal .command-group {
  gap: 2px;
}

.custom-commands-minimal .command-button {
  padding: 2px 6px;
  border: none;
  background: none;
  color: #666;
}

.custom-commands-minimal .command-button:hover:not(:disabled) {
  color: #42b883;
}

.custom-commands-minimal .command-label {
  font-size: 0.75em;
}
</style>