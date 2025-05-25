# Hyper Vue Gantt

A powerful and flexible Gantt chart component for Vue 3 applications. This component is an evolution of the vue-ganttastic package, completely redesigned with TypeScript and enhanced features for modern web applications.

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/logo.png?raw=true" alt="logo HyVueGantt" width="300" height="300">

[![npm version](https://badge.fury.io/js/hy-vue-gantt.svg)](https://badge.fury.io/js/hy-vue-gantt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## 📚 Documentation & Demo

- **[Complete Documentation](https://xeyos88.github.io/HyVueGantt/)** - Comprehensive guides and API reference
- **[Live Demo](https://xeyos88.github.io/HyVueGantt/examples/advanced)** - Interactive examples and features showcase
- **[Getting Started](https://xeyos88.github.io/HyVueGantt/guide/quick-start)** - Step-by-step tutorial

## 🚀 Quick Start

### Installation

```bash
# npm
npm install hy-vue-gantt

# yarn
yarn add hy-vue-gantt

# pnpm
pnpm add hy-vue-gantt
```

### Setup

```typescript
// main.ts
import { createApp } from "vue"
import App from "./App.vue"
import hyvuegantt from "hy-vue-gantt"

const app = createApp(App)
app.use(hyvuegantt)
app.mount("#app")
```

### Basic Usage

```vue
<template>
  <g-gantt-chart
    :chart-start="chartStart"
    :chart-end="chartEnd"
    :precision="precision"
    :bar-start="barStart"
    :bar-end="barEnd"
    color-scheme="vue"
    grid
    commands
  >
    <g-gantt-row
      v-for="row in rows"
      :key="row.id"
      :label="row.label"
      :bars="row.bars"
    />
  </g-gantt-chart>
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { ChartRow } from "hy-vue-gantt"

const chartStart = ref("2024-01-01")
const chartEnd = ref("2024-12-31")
const precision = ref("day")
const barStart = ref("start")
const barEnd = ref("end")

const rows = ref<ChartRow[]>([
  {
    id: 1,
    label: "Design Phase",
    bars: [
      {
        start: "2024-01-05",
        end: "2024-01-20",
        ganttBarConfig: {
          id: "1",
          label: "UI Design",
          style: { background: "#42b883" }
        }
      }
    ]
  }
])
</script>
```

## ✨ Key Features

### 🎯 Core Capabilities

- **📅 Advanced Time Management**: Multi-precision support (hours, days, weeks, months) with auto-scaling
- **🔗 Task Dependencies**: Visual connections with multiple styles (straight, bezier, squared) and animations
- **📊 Progress Tracking**: Interactive progress bars with drag-to-update functionality
- **🏗️ Hierarchical Structure**: Nested groups with expand/collapse functionality
- **📱 Touch & Mobile**: Full touch support with responsive design

### 🎨 Rich Customization

- **🎨 11 Built-in Themes**: From professional to dark mode
- **📋 Multi-Column Labels**: Sortable columns with custom content
- **🏷️ Milestone Support**: Visual milestones with constraints and tooltips
- **🎭 Custom Styling**: Complete slot-based customization system
- **🌍 Internationalization**: Holiday highlighting and locale support

### 💾 Data Management

- **📤 Export Options**: PDF, PNG, SVG, Excel with customizable settings
- **📥 Import Support**: CSV and Jira JSON formats
- **⏪ History Management**: Built-in undo/redo functionality
- **🔄 Real-time Updates**: Live data synchronization

### ⌨️ User Experience

- **🖱️ Drag & Drop**: Intuitive bar and row manipulation
- **⌨️ Keyboard Navigation**: Full accessibility support
- **🎯 Smart Interactions**: Push-on-overlap and connection behaviors
- **🔍 Zoom Controls**: Dynamic scaling with precision adjustment

## 🔧 Advanced Examples

### Task Dependencies & Connections

```typescript
const projectData = ref([
  {
    id: "design",
    label: "Design Phase",
    bars: [
      {
        start: "2024-01-01",
        end: "2024-01-15",
        ganttBarConfig: {
          id: "design-1",
          label: "UI Design",
          connections: [
            {
              targetId: "dev-1",
              type: "bezier",
              animated: true,
              relation: "FS", // Finish to Start
              label: "Prerequisite",
              color: "#42b883"
            }
          ]
        }
      }
    ]
  },
  {
    id: "development",
    label: "Development Phase",
    bars: [
      {
        start: "2024-01-16",
        end: "2024-02-15",
        ganttBarConfig: {
          id: "dev-1",
          label: "Frontend Development",
          progress: 75,
          progressResizable: true
        }
      }
    ]
  }
])
```

### Milestones & Project Tracking

```vue
<template>
  <g-gantt-chart
    :milestones="milestones"
    :timeaxis-events="events"
    show-events-axis
  >
    <template #milestone="{ milestone }">
      <div class="custom-milestone">🎯 {{ milestone.name }}</div>
    </template>
  </g-gantt-chart>
</template>

<script setup lang="ts">
const milestones = ref([
  {
    id: "v1-release",
    date: "2024-03-15",
    name: "Version 1.0 Release",
    description: "Major product release",
    color: "#e74c3c"
  }
])

const events = ref([
  {
    id: "sprint-1",
    label: "Sprint Planning",
    startDate: "2024-01-01",
    endDate: "2024-01-03",
    backgroundColor: "#3498db"
  }
])
</script>
```

### Multi-Column Layout & Sorting

```vue
<template>
  <g-gantt-chart
    label-column-title="Project Management"
    :multi-column-label="columns"
    sortable
    label-resizable
  >
    <template #label-column-priority="{ value, row }">
      <span :class="getPriorityClass(value)">
        {{ value }}
      </span>
    </template>
  </g-gantt-chart>
</template>

<script setup lang="ts">
const columns = ref([
  { field: "Label", sortable: true },
  { field: "StartDate", sortable: true },
  { field: "Duration", sortable: true },
  { field: "Progress", sortable: true },
  {
    field: "Priority",
    valueGetter: (row) => row.priority || "Normal",
    sortFn: (a, b) => prioritySort(a, b)
  }
])
</script>
```

### Import/Export Integration

```vue
<template>
  <g-gantt-chart
    export-enabled
    :export-options="exportConfig"
    show-importer
    :importer-allowed-formats="['csv', 'jira']"
    @export-success="handleExportSuccess"
    @import-data="handleImportData"
  >
    <template #commands="{ export: triggerExport }">
      <button @click="triggerExport" class="export-btn">
        📊 Export Project
      </button>
    </template>
  </g-gantt-chart>
</template>

<script setup lang="ts">
const exportConfig = ref({
  format: "pdf",
  paperSize: "a4",
  orientation: "landscape",
  exportColumnLabel: true,
  scale: 1.5
})

const handleExportSuccess = (result) => {
  console.log("Export completed:", result.filename)
}

const handleImportData = (result) => {
  if (result.success) {
    // Update chart data with imported rows
    updateChartData(result.data.rows)
  }
}
</script>
```

## 🎨 Theming & Customization

### Built-in Color Schemes

```vue
<template>
  <!-- Choose from 11 professional themes -->
  <g-gantt-chart color-scheme="vue" />
  <!-- Vue.js inspired -->
  <g-gantt-chart color-scheme="dark" />
  <!-- Dark mode -->
  <g-gantt-chart color-scheme="material-blue" />
  <!-- Material Design -->
</template>
```

Available themes: `default`, `vue`, `dark`, `material-blue`, `creamy`, `crimson`, `flare`, `fuchsia`, `grove`, `sky`, `slumber`

### Custom Styling

```typescript
const customTheme = {
  primary: "#1e40af",
  secondary: "#3b82f6",
  text: "#1f2937",
  background: "#ffffff",
  hoverHighlight: "rgba(59, 130, 246, 0.1)"
}
```

## 📱 Mobile & Touch Support

HyVue Gantt provides comprehensive mobile support:

- **Touch Gestures**: Drag, resize, and navigate with touch
- **Responsive Layout**: Adapts to different screen sizes
- **Mobile Optimized**: Touch-friendly controls and interactions
- **Gesture Recognition**: Pinch-to-zoom, swipe navigation

## 🔌 Event System

```vue
<template>
  <g-gantt-chart
    @click-bar="onBarClick"
    @dragend-bar="onBarMoved"
    @progress-change="onProgressUpdate"
    @connection-complete="onConnectionCreated"
    @row-drop="onRowReordered"
    @sort="onDataSorted"
    @label-edit="onLabelEdited"
  />
</template>

<script setup lang="ts">
const onBarClick = ({ bar, datetime }) => {
  console.log(`Clicked ${bar.ganttBarConfig.label} at ${datetime}`)
}

const onBarMoved = ({ bar, movedBars }) => {
  // Handle bar position changes
  updateBackendData(bar)
}

const onProgressUpdate = ({ bar }) => {
  // Sync progress changes
  saveProgress(bar.ganttBarConfig.id, bar.ganttBarConfig.progress)
}
</script>
```

## 🛠️ TypeScript Support

Full TypeScript integration with comprehensive type definitions:

```typescript
import type {
  GanttBarObject,
  ChartRow,
  ConnectionType,
  GanttMilestone,
  TimeaxisEvent,
  ExportOptions,
  ImportResult
} from "hy-vue-gantt"

// Extend base types for your specific needs
interface ProjectTask extends GanttBarObject {
  assignee: string
  priority: "low" | "medium" | "high"
  tags: string[]
}

interface ProjectRow extends ChartRow {
  department: string
  budget: number
  bars: ProjectTask[]
}
```

## 🚀 Performance Features

- **Virtual Scrolling**: Handles large datasets efficiently
- **Smart Rendering**: Only renders visible elements
- **Optimized Updates**: Minimal re-renders with Vue 3 reactivity
- **Memory Management**: Automatic cleanup and garbage collection
- **Lazy Loading**: Progressive data loading for better performance

## 📋 Browser Support

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+
- **Mobile Browsers**: Full support

## 🔧 Development & Contributing

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/Xeyos88/HyVueGantt.git
cd HyVueGantt

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build library
npm run build
```

### Contributing Guidelines

We welcome contributions! Please:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

See our [Contributing Guide](CONTRIBUTING.md) for detailed information.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Based on [vue-ganttastic](https://github.com/zunnzunn/vue-ganttastic) - Special thanks to the original authors
- Inspired by modern project management tools
- Built with love for the Vue.js community

## ☕ Support the Project

If HyVue Gantt helps your project, consider supporting its development:

[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/xeyos88)

## 📸 Screenshots

### Modern Interface

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt1.PNG?raw=true" alt="Modern Gantt Interface" width="800" height="200">

### Dark Theme

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt2.PNG?raw=true" alt="Dark Theme Gantt" width="800" height="200">

### Multi-Column Layout

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt3.PNG?raw=true" alt="Multi-Column Gantt" width="800" height="200">

### Connection Management

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/Gantt4.png?raw=true" alt="Gantt Connections" width="800" height="200">

---
