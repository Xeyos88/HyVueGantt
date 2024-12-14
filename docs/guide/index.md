# Hyper Vue Gantt 

A powerful and flexible Gantt chart component for Vue 3 applications. This component is an evolution of vue-ganttastic.

## Features

- 📅 **Flexible Time Management**: Support for various time units (hours, days, weeks, months)
- 🎨 **Customizable Styling**: Multiple built-in color schemes and custom styling options
- 🔗 **Bar Connections**: Visual connections between bars with different styles
- 📱 **Responsive**: Works across different screen sizes
- ⌨️ **Keyboard Navigation**: Full keyboard support for accessibility
- 🎯 **Drag & Drop**: Intuitive drag and drop interface
- 🔄 **Real-time Updates**: Live updates and animations

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

## Getting Started
