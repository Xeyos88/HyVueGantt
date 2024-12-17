# Installation

This guide will help you install and setup HyVue Gantt in your Vue 3 project.

## Requirements

Before installing HyVue Gantt, ensure your project meets these prerequisites:

- Vue 3.3 or higher
- TypeScript 5.0 or higher (recommended but optional)
- Node.js 16 or higher
- npm 7 or higher or yarn 1.22 or higher

## Installation Methods

### Using npm

```bash
npm install hy-vue-gantt
```

### Using yarn

```bash
yarn add hy-vue-gantt
```

## Basic Setup

### Global Registration

Add HyVue Gantt to your Vue application by registering it in your main entry file:

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import hyvuegantt from 'hy-vue-gantt'

// Import the default styles
import 'hy-vue-gantt/dist/style.css'

const app = createApp(App)
app.use(hyvuegantt)
app.mount('#app')
```

### Component Registration

Alternatively, you can import components individually:

```typescript
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

export default {
  components: {
    GGanttChart,
    GGanttRow
  }
}
```

## TypeScript Support

HyVue Gantt includes built-in TypeScript declarations. To get full TypeScript support, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "types": ["hy-vue-gantt"]
  }
}
```

## Additional Dependencies

HyVue Gantt automatically handles these dependencies, but it's good to know they're being used:

- dayjs: For date manipulation
- @vueuse/core: For Vue composition utilities
- @fortawesome/fontawesome: For icons

## What's Next?

After installation, you might want to:

- Check out our [Quick Start Guide](/guide/quick-start) for your first Gantt chart
- Learn about [Chart Configuration](/guide/chart-configuration)
- Explore [Examples](/examples/basic) to see what's possible

## Troubleshooting

If you encounter any installation issues:

1. Ensure all peer dependencies are correctly installed
2. Check that your Vue version is compatible
3. Clear your package manager cache and node_modules
4. Try with a fresh installation

For more help, visit our [GitHub Issues](https://github.com/Xeyos88/HyVueGantt/issues) page.