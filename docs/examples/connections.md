# Connections Examples

This section shows how to implement and customize bar connections.

## Basic Connections

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :enable-connections="true"
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
const rows = ref([
  {
    label: 'Phase 1',
    bars: [{
      start: '2024-01-01',
      end: '2024-01-15',
      ganttBarConfig: {
        id: '1',
        label: 'Task 1',
        connections: [{
          targetId: '2',
          type: 'straight',
          color: '#ff0000'
        }]
      }
    }]
  },
  {
    label: 'Phase 2',
    bars: [{
      start: '2024-01-16',
      end: '2024-01-30',
      ganttBarConfig: {
        id: '2',
        label: 'Task 2'
      }
    }]
  }
])
</script>
```

## Advanced Connections

Example with different connection types and animations:

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :enable-connections="true"
    :push-on-connect="true"
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
const connections = [
  {
    targetId: '2',
    type: 'bezier',
    pattern: 'dash',
    animated: true,
    animationSpeed: 'normal'
  },
  {
    targetId: '3',
    type: 'squared',
    pattern: 'dot',
    color: '#42b883'
  }
]

const rows = ref([
  {
    label: 'Connected Tasks',
    bars: [{
      start: '2024-01-01',
      end: '2024-01-15',
      ganttBarConfig: {
        id: '1',
        label: 'Root Task',
        connections
      }
    }]
  }
])
</script>
```