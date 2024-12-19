# Hyper Vue Gantt

A powerful Gantt chart component for Vue 3, evolved from vue-ganttastic. Provides flexible and performant timeline visualization for modern applications.

<img src="https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/logo.png?raw=true" alt="logo HyVueGantt" witdh="300" height="300">

## Guide and Docs

For further guides and references, check out the [documentation](https://github.com/Xeyos88/HyVueGantt).  

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

- 📅 **Flexible Time Units**: Support for hours, days, weeks, and months
- 🎨 **Customizable**: Multiple built-in color schemes and styling options
- 🔗 **Bar Connections**: Visual connections with different styles and animations
- 📱 **Responsive**: Adapts to different screen sizes
- ⌨️ **Keyboard Navigation**: Full keyboard support for accessibility
- 🎯 **Drag & Drop**: Intuitive interface for timeline management
- 🚀 **TypeScript**: Full TypeScript support with predefined types

## 📝 License

MIT
