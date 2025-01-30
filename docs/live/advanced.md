# Advanced Demo

This comprehensive demo showcases all the capabilities and customization options available in the GGanttChart component. It provides a fully interactive interface for exploring and experimenting with different settings and configurations.

## Live Demo

<ClientOnly>
  <AdvancedGanttDemo />
</ClientOnly>

## Features Overview

The demo provides a complete configuration panel that allows real-time adjustment of all available settings. These are organized into logical groups for easier navigation:

### Time Management

The time settings section allows configuration of fundamental temporal aspects of the chart. This includes precision settings, date formats, and current time display options. These settings affect how time is represented and manipulated within the chart.

### Display Configuration

The display settings control the visual aspects of the chart, from color schemes to layout dimensions. You can experiment with different visual configurations to find the optimal presentation for your needs.

### Behavior Controls

The behavior settings determine how the chart interacts with user input, including drag-and-drop functionality, sorting capabilities, and connection management.

## Code Example

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { GGanttChart, GGanttRow, type ChartRow, type LabelColumnConfig } from 'hy-vue-gantt'

// Time Settings Configuration
const precision = ref('day')
const chartStart = ref('2024-01-01')
const chartEnd = ref('2024-12-31')
const dateFormat = ref('YYYY-MM-DD HH:mm')
const enableMinutes = ref(false)
const currentTime = ref(true)
const currentTimeLabel = ref('Now')

// Display Settings Configuration
const hideTimeaxis = ref(false)
const colorScheme = ref('vue')
const grid = ref(true)
const rowHeight = ref(40)
const font = ref('inherit')
const labelColumnTitle = ref('Project Tasks')
const labelColumnWidth = ref(200)
const commands = ref(true)
const width = ref('100%')

// Behavior Settings Configuration
const pushOnOverlap = ref(true)
const pushOnConnect = ref(true)
const noOverlap = ref(false)
const enableConnections = ref(true)
const sortable = ref(true)
const labelResizable = ref(true)
const enableRowDragAndDrop = ref(true)
const maxRows = ref(5)

// Available Options Configuration
const availableColorSchemes = [
  'default', 'vue', 'dark', 'creamy', 'crimson', 'flare', 
  'fuchsia', 'grove', 'material-blue', 'sky', 'slumber'
]

const availablePrecisions = ['hour', 'day', 'week', 'month']
const availableLocales = ['en', 'it', 'fr', 'de', 'es']

// UI Settings Groups
const timeSettings = computed(() => [
  { label: 'Precision', type: 'select', model: precision, options: availablePrecisions },
  { label: 'Enable Minutes', type: 'checkbox', model: enableMinutes },
  { label: 'Show Current Time', type: 'checkbox', model: currentTime },
  { label: 'Date Format', type: 'text', model: dateFormat }
])
</script>

<template>
  <div class="complete-demo">
    <div class="settings-panel">
      <h3>Gantt Chart Configuration</h3>
      
      <!-- Time Settings -->
      <div class="settings-group">
        <h4>Time Settings</h4>
        <div class="settings-grid">
          <div v-for="setting in timeSettings" :key="setting.label" class="setting-item">
            <label>
              {{ setting.label }}:
              <template v-if="setting.type === 'select'">
                <select v-model="setting.model">
                  <option v-for="option in setting.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </template>
              <template v-else-if="setting.type === 'checkbox'">
                <input type="checkbox" v-model="setting.model">
              </template>
              <template v-else>
                <input type="text" v-model="setting.model">
              </template>
            </label>
          </div>
        </div>
      </div>

      <!-- Gantt Chart Component -->
      <g-gantt-chart
        :chart-start="chartStart"
        :chart-end="chartEnd"
        :precision="precision"
        bar-start="start"
        bar-end="end"
        :width="width"
        :hide-timeaxis="hideTimeaxis"
        :color-scheme="colorScheme"
        :grid="grid"
        :push-on-overlap="pushOnOverlap"
        :push-on-connect="pushOnConnect"
        :no-overlap="noOverlap"
        :row-height="rowHeight"
        :font="font"
        :label-column-title="labelColumnTitle"
        :label-column-width="labelColumnWidth"
        :commands="commands"
        :enable-minutes="enableMinutes"
        :enable-connections="enableConnections"
        :max-rows="maxRows"
        :current-time="currentTime"
        :current-time-label="currentTimeLabel"
        :date-format="dateFormat"
        :enable-row-drag-and-drop="enableRowDragAndDrop"
      >
        <!-- Chart Content -->
      </g-gantt-chart>
    </div>
  </div>
</template>
```

## Key Features Demonstrated

### Interactive Configuration

The demo provides real-time configuration of all major chart features through an intuitive interface. Users can experiment with different settings and immediately see their effects on the chart.

### Data Structure Support

The example demonstrates support for complex data structures including:
- Hierarchical task grouping
- Task dependencies and connections
- Multiple time scales and precisions
- Custom styling and appearance options

### Event Handling

The demo implements comprehensive event handling for all major interactions:
- Click events on bars and elements
- Drag and drop operations
- Sorting and grouping actions
- Timeline navigation

### Visual Customization

Extensive visual customization options are available:
- Multiple color schemes
- Layout adjustments
- Time axis display options
- Grid and visual element styling

## Usage Examples

The demo can be used in several ways:

For Exploration: Developers can use the interactive interface to explore available features and understand their effects.

For Configuration: The demo serves as a configuration playground where developers can experiment with different settings to find the optimal configuration for their needs.

For Learning: The code structure provides a comprehensive example of how to implement and customize the Gantt chart component in a real application.

## Best Practices

When implementing similar functionality in your own applications, consider these best practices demonstrated in the demo:

Organization: Group related settings and controls logically for better user experience.

Reactivity: Utilize Vue's reactive system effectively for real-time updates and smooth interactions.

Customization: Leverage the component's extensive customization options to match your application's needs.

Error Handling: Implement proper event handling and state management for robust functionality.