# Hyper Vue Gantt

A powerful and flexible Gantt chart component for Vue 3 applications. This component is an evolution of the vue-ganttastic package, completely redesigned with TypeScript and enhanced features for modern web applications.

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/logo.png?raw=true" alt="logo HyVueGantt" width="300" height="300">

## Guide and Documentation

For detailed guides and references, check out the [complete documentation](https://xeyos88.github.io/HyVueGantt/).

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

- 📅 **Flexible Time Management**:
  - Support for various time units (hours, days, weeks, months)
  - Auto-adjusting precision based on view scale
  - Custom day format display (number, day, day of year, name)
  - Holiday highlighting with tooltips
- 🎨 **Rich Customization**:
  - Multiple label columns with sorting capability
  - Column resizing
  - Custom column definitions
  - 11 built-in color schemes
  - Full support for custom components via slots
- 🔗 **Advanced Bar Management**:
  - Visual connections between bars with different styles (straight, bezier, squared)
  - Milestone support with tooltips and constraints
  - Bundle support for synchronized bar movements
  - Push-on-connect and push-on-overlap behaviors
  - Progress bars with customizable percentages
- 💾 **Import/Export**:

  - Export to PDF, PNG, SVG, and Excel
  - Import from CSV and JSON (Jira) formats
  - Customization options for exports (size, margins, orientation)

- 📱 **Responsive & Touch Support**:

  - Works across different screen sizes
  - Full touch support for mobile devices
  - Drag and resize bars on touch devices

- ⌨️ **Keyboard Navigation**: Full keyboard support for accessibility
- 🎯 **Intuitive Interface**: Drag & drop functionality for rows and bars
- 🚀 **TypeScript**: Complete TypeScript support with predefined types

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

### Export and Import

Export your Gantt chart to various formats:

```vue
<template>
  <g-gantt-chart
    export-enabled
    :export-options="{
      format: 'pdf',
      paperSize: 'a4',
      orientation: 'landscape',
      filename: 'my-project-gantt'
    }"
    @export-success="handleExportSuccess"
  />
</template>
```

Import data from CSV or Jira:

```vue
<template>
  <g-gantt-chart
    show-importer
    importer-title="Import Data"
    :importer-allowed-formats="['csv', 'jira']"
    @import-data="handleImportedData"
  />
</template>
```

### Grouped Rows and Hierarchy

Create hierarchical task structures with expandable groups:

```vue
<template>
  <g-gantt-chart ...props>
    <g-gantt-row
      label="Project Phase 1"
      :id="'phase1'"
      :bars="phaseBars"
      :children="[
        {
          id: 'task1',
          label: 'Task 1.1',
          bars: task1Bars
        },
        {
          id: 'task2',
          label: 'Task 1.2',
          bars: task2Bars
        }
      ]"
    />
  </g-gantt-chart>
</template>
```

## TypeScript Support

HyVue Gantt includes comprehensive TypeScript definitions. Example usage with full type support:

```typescript
import type {
  GanttBarObject,
  ChartRow,
  ConnectionType,
  GanttMilestone,
  TimeaxisEvent
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
        label: "Custom Bar",
        connections: []
      }
    }
  ]
}
```

## Available Events

HyVue Gantt provides numerous events to interact with the chart:

```vue
<template>
  <g-gantt-chart
    @click-bar="onBarClick"
    @dragend-bar="onBarDragEnd"
    @progress-change="onProgressChange"
    @connection-complete="onConnectionComplete"
    @row-drop="onRowDrop"
    @sort="onSort"
    @group-expansion="onGroupExpand"
    @export-success="onExportSuccess"
    @import-data="onImportData"
  />
</template>
```

## Touch Support

HyVue Gantt provides full touch support for mobile devices:

- Drag and resize bars via touch
- Pinch to zoom timeline
- Long press to initiate connections
- Swipe to navigate
- Touch-based group expansion/collapse

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Submitting issues
- Development setup
- Coding standards
- Pull request process

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Buy me a coffee

A coffee helps to do a better job! \
Donate on [paypal](https://www.paypal.com/paypalme/xeyos88).

## Acknowledgments

This project is based on [vue-ganttastic](https://github.com/zunnzunn/vue-ganttastic) and has been completely rewritten with updated TypeScript and enhanced features. Special thanks to the original authors and all contributors.

## Screenshots

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt1.PNG?raw=true" alt="screenshot HyVueGantt" width="800" height="200">

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt2.PNG?raw=true" alt="screenshot HyVueGantt" width="800" height="200">

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt3.PNG?raw=true" alt="screenshot HyVueGantt" width="800" height="200">

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt4.png?raw=true" alt="screenshot HyVueGantt" width="800" height="200">
