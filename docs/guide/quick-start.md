# Quick Start

This guide will help you create your first Gantt chart using HyVue Gantt. We'll build a simple project management timeline to demonstrate the core features.

## Your First Gantt Chart

Let's create a basic project timeline with three tasks. We'll show you how to set up the chart, add tasks, and customize their appearance.

### Basic Setup

First, create a new component in your Vue project:

```vue
<template>
  <g-gantt-chart
    :chart-start="chartStart"
    :chart-end="chartEnd"
    :precision="precision"
    :bar-start="barStart"
    :bar-end="barEnd"
    :row-height="40"
    grid
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
import type { ChartRow } from 'hy-vue-gantt'

// Chart configuration
const chartStart = ref('2024-01-01')
const chartEnd = ref('2024-03-31')
const precision = ref('day')
const barStart = ref('start')
const barEnd = ref('end')

// Project data
const rows = ref<ChartRow[]>([
  {
    label: 'Design Phase',
    bars: [
      {
        start: '2024-01-05',
        end: '2024-01-20',
        ganttBarConfig: {
          id: '1',
          label: 'UI Design',
          style: { background: '#42b883' }
        }
      }
    ]
  },
  {
    label: 'Development',
    bars: [
      {
        start: '2024-01-21',
        end: '2024-02-15',
        ganttBarConfig: {
          id: '2',
          label: 'Frontend Implementation',
          style: { background: '#35495e' }
        }
      }
    ]
  },
  {
    label: 'Testing',
    bars: [
      {
        start: '2024-02-10',
        end: '2024-02-28',
        ganttBarConfig: {
          id: '3',
          label: 'QA Testing',
          style: { background: '#ff7e67' }
        }
      }
    ]
  }
])
</script>
```

## Understanding the Code

Let's break down the key components:

### Chart Properties

- `chart-start` and `chart-end`: Define the visible time range
- `precision`: Sets the time unit ('hour', 'day', 'week', or 'month')
- `bar-start` and `bar-end`: Specify which properties of your data contain the start and end dates
- `row-height`: Controls the height of each row
- `grid`: Enables the background grid

### Data Structure

Each task in your Gantt chart needs:

- A unique identifier
- Start and end dates
- A label
- Optional styling configuration

## Adding Interactivity

Let's enhance our chart with some interactive features:

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    @click-bar="handleBarClick"
    @drag-bar="handleBarDrag"
    @dragend-bar="handleBarDragEnd"
  >
  </g-gantt-chart>
</template>

<script setup lang="ts">

const chartConfig = {
  chartStart: chartStart.value,
  chartEnd: chartEnd.value,
  precision: precision.value,
  barStart: barStart.value,
  barEnd: barEnd.value,
  rowHeight: 40,
  grid: true,
  pushOnOverlap: true,
  colorScheme: 'default'
}

const handleBarClick = (event: any) => {
  console.log('Bar clicked:', event.bar.ganttBarConfig.label)
}

const handleBarDrag = (event: any) => {
  console.log('Bar being dragged:', event.bar)
}

const handleBarDragEnd = (event: any) => {
  console.log('Final position:', event.bar.start, event.bar.end)
}
</script>
```

## Next Steps

Now that you have a basic Gantt chart working, you can:

1. Learn about [Chart Configuration](/guide/chart-configuration) for more customization options
2. Explore [Bar Connections](/guide/connections) to show dependencies between tasks
3. Check out [Custom Styling](/guide/styling) to match your application's design
4. See more [Examples](/examples/basic) for advanced usage patterns

## Common Patterns

### Adding Bar Connections

To show task dependencies:

```typescript
const bars = [
  {
    // ... other bar properties
    ganttBarConfig: {
      id: '1',
      connections: [
        { targetId: '2', type: 'straight' }
      ]
    }
  }
]
```

### Custom Bar Styling

To customize individual bars:

```typescript
ganttBarConfig: {
  id: '1',
  style: {
    background: 'linear-gradient(to right, #42b883, #35495e)',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
}
```

### Handling Updates

Remember to use Vue's reactivity system when updating data:

```typescript
const updateTask = (barId: string, newStart: string, newEnd: string) => {
  const row = rows.value.find(row => 
    row.bars.some(bar => bar.ganttBarConfig.id === barId)
  )
  if (row) {
    const bar = row.bars.find(bar => bar.ganttBarConfig.id === barId)
    if (bar) {
      bar.start = newStart
      bar.end = newEnd
    }
  }
}
```

## Tips for Success

1. Always provide unique IDs for your bars
2. Use consistent date formats throughout your application
3. Consider time zones when working with dates
4. Test drag-and-drop behavior with overlapping tasks
5. Implement error handling for date validation

Need more help? Check our [GitHub repository](https://github.com/Xeyos88/HyVueGantt) or create an issue if you encounter any problems.