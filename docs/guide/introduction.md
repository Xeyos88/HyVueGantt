# Hyper Vue Gantt

A powerful and flexible Gantt chart component for Vue 3 applications. This component is an evolution of [vue-ganttastic](https://github.com/zunnzunn/vue-ganttastic) package.

## Features

- 📅 **Flexible Time Management**: Support for various time units (hours, days, weeks, months) with customizable date formats
- 🎨 **Customizable Styling**: Multiple built-in color schemes and comprehensive styling options for every element
- 🔗 **Bar Connections**: Create visual dependencies between tasks with various connection styles and animations
- 📱 **Responsive Design**: Adaptive layout that works across different screen sizes and devices
- ⌨️ **Keyboard Navigation**: Full keyboard support for accessibility and efficient operation
- 🔄 **Drag & Drop Interactions**: Intuitive drag and drop interface with overlap prevention and push behavior
- 📊 **Grouping & Hierarchies**: Support for hierarchical task structures with collapsible groups
- 📝 **Editing Capabilities**: In-place editing of task labels and progress indicators
- ⏱️ **Real-time Updates**: Live updates and animations for dynamic data visualization
- 🔄 **History Management**: Built-in undo/redo functionality for user operations

## Why Hyper Vue Gantt?

Hyper Vue Gantt is designed to provide a seamless experience for creating and managing Gantt charts in Vue applications. Whether you're building a project management tool, a scheduling system, or any application that requires timeline visualization, Hyper Vue Gantt offers the flexibility and features you need.

## Quick Example

```vue
<template>
  <g-gantt-chart
    :chart-start="chartStart"
    :chart-end="chartEnd"
    :rows="rows"
    :precision="precision"
    :bar-start="barStart"
    :bar-end="barEnd"
    :date-format="dateFormat"
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
const chartStart = "2024-01-01"
const chartEnd = "2024-12-31"
const precision = "day"
const barStart = "start"
const barEnd = "end"
const dateFormat = "YYYY-MM-DD"

const rows = [
  {
    label: "Task 1",
    bars: [
      {
        start: "2024-01-01",
        end: "2024-01-15",
        ganttBarConfig: {
          id: "1",
          label: "Task 1",
          style: { background: "#42b883" }
        }
      }
    ]
  }
]
</script>
```
