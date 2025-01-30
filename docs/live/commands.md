# Commands Slot Demo

This demo showcases the various ways to customize the commands section of the Gantt chart using the `commands` slot:

## Live Demo

<ClientOnly>
  <CommandsGanttDemo />
</ClientOnly>

## Code Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

const commandsStyle = ref('default')
const showZoom = ref(true)
const showNavigation = ref(true)
const showHistory = ref(true)

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
            id: '1',
            label: 'Development',
            style: { background: '#42b883' }
          }
        }]
      }
    ]
  }
])

// Different style configurations for the commands section
const commandStyles = {
  default: '',
  modern: `
    .custom-commands {
      display: flex;
      gap: 20px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 4px;
    }
    .command-group {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 4px 8px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    // ... other styles
  `,
  minimal: `
    .custom-commands {
      display: flex;
      gap: 10px;
      padding: 8px;
    }
    // ... other styles
  `
}
</script>

<template>
  <div class="demo-container">
    <!-- Controls for demo customization -->
    <div class="controls">
      <label class="control-item">
        <span>Style:</span>
        <select v-model="commandsStyle">
          <option value="default">Default</option>
          <option value="modern">Modern</option>
          <option value="minimal">Minimal</option>
        </select>
      </label>
      <!-- Other controls -->
    </div>

    <g-gantt-chart
      chart-start="2024-01-15"
      chart-end="2024-02-15"
      precision="day"
      bar-start="start"
      bar-end="end"
      grid
      :commands="false"
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
        <style>
          {{ commandStyles[commandsStyle] }}
        </style>
        
        <div class="custom-commands">
          <!-- Zoom Controls -->
          <template v-if="showZoom">
            <div class="command-group">
              <span class="command-label">Zoom</span>
              <button class="command-button" @click="zoomOut" :disabled="zoomLevel === 1">-</button>
              <span>{{ zoomLevel }}x</span>
              <button class="command-button" @click="zoomIn" :disabled="zoomLevel === 10">+</button>
            </div>
          </template>

          <!-- Navigation Controls -->
          <template v-if="showNavigation">
            <div class="command-group">
              <span class="command-label">Navigation</span>
              <button class="command-button" @click="handleToStart">⟪</button>
              <button class="command-button" @click="handleBack">⟨</button>
              <button class="command-button" @click="handleForward">⟩</button>
              <button class="command-button" @click="handleToEnd">⟫</button>
            </div>
          </template>

          <!-- History Controls -->
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
```

This example demonstrates:

1. Different styling options for the commands section
2. Selective display of command groups
3. Proper usage of all available command functions
4. Integration with the chart's state
5. Responsive and accessible controls

The commands slot provides a high degree of flexibility while maintaining all the core functionality