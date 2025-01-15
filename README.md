# Hyper Vue Gantt

A powerful and flexible Gantt chart component for Vue 3 applications. This component is an evolution of vue-ganttastic package, redesigned with TypeScript and enhanced features.

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/logo.png?raw=true" alt="logo HyVueGantt" witdh="300" height="300">

## Guide and Docs

For further guides and references, check out the [documentation](https://xeyos88.github.io/HyVueGantt/).

## 🚀 Installation

```bash
# npm
npm install hy-vue-gantt

# yarn
yarn add hy-vue-gantt

# pnpm
pnpm add hy-vue-gantt
```

### Register Component

```typescript
// main.ts
import { createApp } from "vue"
import App from "./App.vue"
import hyvuegantt from "hy-vue-gantt"

const app = createApp(App)
app.use(hyvuegantt)
app.mount("#app")
```

## 💡 Basic Example

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
```

## ✨ Key Features

### Core Features

- 📅 **Flexible Time Management**: Support for various time units (hours, days, weeks, months)
  - Auto-adjusting precision based on view scale
  - Custom day format display (number, day, doy, name)
  - Holiday highlighting with tooltips
- 🎨 **Rich Customization**:
  - Multiple label columns with sorting capability
  - Column resizing
  - Custom column definitions
  - 11 built-in color schemes
- 🔗 **Advanced Bar Management**:
  - Visual connections between bars with different styles
  - Milestone support with tooltips and constraints
  - Bundle support for grouped movements
  - Push-on-connect and push-on-overlap behaviors
- 📱 **Responsive**: Works across different screen sizes
- ⌨️ **Keyboard Navigation**: Full keyboard support for accessibility
- 🎯 **Intuitive Interface**: Drag & drop functionality
- 🚀 **TypeScript**: Full TypeScript support with predefined types

## Advanced Examples

### Milestones

Define and visualize project milestones with custom styling and tooltips:

```vue
<template>
  <g-gantt-chart :milestones="milestones" ...other props>
    <template #milestone="{ milestone }">
      <div class="custom-milestone">
        {{ milestone.name }}
      </div>
    </template>
  </g-gantt-chart>
</template>

<script setup lang="ts">
const milestones = ref([
  {
    id: "milestone1",
    date: "2024-01-15",
    name: "Phase 1 Complete",
    description: "Initial development phase completion",
    color: "#42b883"
  }
])
</script>
```

### Custom Label Columns

Implement multi-column layouts with sorting and custom content:

```vue
<template>
  <g-gantt-chart
    label-column-title="Project Details"
    :multi-column-label="multiColumnLabel"
    sortable
    ...other
    props
  />
</template>

<script setup lang="ts">
const multiColumnLabel = ref([
  {
    field: "Id",
    sortable: true
  },
  {
    field: "Label",
    sortable: true
  },
  {
    field: "StartDate",
    sortable: true
  },
  {
    field: "Duration",
    sortable: true
  },
  {
    field: "Custom",
    valueGetter: (row) => computeCustomValue(row),
    sortFn: (a, b) => customSort(a, b)
  }
])
</script>
```

### Bar Connections

Create sophisticated task dependencies with animated connections:

```typescript
const bars = [
  {
    start: "2024-01-01",
    end: "2024-01-15",
    ganttBarConfig: {
      id: "1",
      label: "Task 1",
      connections: [
        {
          targetId: "2",
          type: "bezier",
          animated: true,
          pattern: "dash",
          color: "#42b883",
          animationSpeed: "normal"
        }
      ]
    }
  }
]
```

### Custom Day Display

Configure how day units are displayed in the timeline:

```vue
<template>
  <g-gantt-chart :day-option-label="['day', 'name', 'doy']" ...other props />
</template>
```

### Holiday Highlighting

Enable holiday highlighting with custom styling:

```vue
<template>
  <g-gantt-chart
    holiday-highlight="US"
    :color-scheme="{
      ...defaultScheme,
      holidayHighlight: 'rgba(255, 0, 0, 0.1)'
    }"
    ...other
    props
  />
</template>
```

## TypeScript Support

HyVue Gantt includes comprehensive TypeScript definitions. Example usage with full type support:

```typescript
import type {
  GanttBarObject,
  ChartRow,
  ConnectionType,
  GanttMilestone
} from "hy-vue-gantt"

interface CustomBar extends GanttBarObject {
  customField: string
}

const row: ChartRow = {
  label: "Custom Row",
  bars: [
    {
      start: "2024-01-01",
      end: "2024-01-15",
      customField: "value",
      ganttBarConfig: {
        id: "1",
        label: "Custom Bar"
      }
    }
  ]
}
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Submitting issues
- Development setup
- Coding standards
- Pull request process

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This project is based on [vue-ganttastic](https://github.com/zunnzunn/vue-ganttastic) and has been completely rewritten with update TypeScript and enhanced features. Special thanks to the original authors and all contributors.

## Screenshots

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt1.PNG?raw=true" alt="screenshot HyVueGantt" width="800" height="200">

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt2.PNG?raw=true" alt="screenshot HyVueGantt" width="800" height="200">

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt3.PNG?raw=true" alt="screenshot HyVueGantt" width="800" height="200">

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt4.png?raw=true" alt="screenshot HyVueGantt" width="800" height="200">
