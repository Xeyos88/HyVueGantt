# Basic Usage

This section demonstrates the fundamental usage patterns of HyVue Gantt.

## Simple Timeline

The most basic implementation of a Gantt chart:

```vue
<template>
  <g-gantt-chart
    :chart-start="chartStart"
    :chart-end="chartEnd"
    :precision="precision"
    :bar-start="barStart"
    :bar-end="barEnd"
  >
    <g-gantt-row
      v-for="row in rows"
      :key="row.label"
      :label="row.label"
      :bars="row.bars"
    />
  </g-gantt-chart>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const chartStart = ref('2024-01-01')
const chartEnd = ref('2024-12-31')
const precision = ref('day')
const barStart = ref('start')
const barEnd = ref('end')

const rows = ref([
  {
    label: 'Project Planning',
    bars: [
      {
        start: '2024-01-01',
        end: '2024-01-15',
        ganttBarConfig: {
          id: '1',
          label: 'Initial Planning'
        }
      }
    ]
  }
])
</script>
```

## Handling Events

Example with event handling:

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    @click-bar="handleBarClick"
    @dragend-bar="handleBarDragEnd"
  >
    <g-gantt-row
      v-for="row in rows"
      :key="row.label"
      :label="row.label"
      :bars="row.bars"
    />
  </g-gantt-chart>
</template>

<script setup lang="ts">
const handleBarClick = (event) => {
  console.log('Bar clicked:', event.bar.ganttBarConfig.label)
}

const handleBarDragEnd = (event) => {
  // Update your data store here
  console.log('New dates:', event.bar.start, event.bar.end)
}
</script>
```

## Dynamic Updates

Example showing dynamic data updates:

```vue
<template>
  <div>
    <button @click="addNewTask">Add Task</button>
    <g-gantt-chart v-bind="chartConfig">
      <g-gantt-row
        v-for="row in rows"
        :key="row.label"
        :label="row.label"
        :bars="row.bars"
      />
    </g-gantt-chart>
  </div>
</template>

<script setup lang="ts">
const addNewTask = () => {
  rows.value.push({
    label: `Task ${rows.value.length + 1}`,
    bars: [{
      start: '2024-02-01',
      end: '2024-02-15',
      ganttBarConfig: {
        id: crypto.randomUUID(),
        label: 'New Task'
      }
    }]
  })
}
</script>
```