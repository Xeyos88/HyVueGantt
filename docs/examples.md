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

---

# Styling Examples

This section demonstrates various styling options available in HyVue Gantt.

## Color Schemes

Example using different built-in color schemes:

```vue
<template>
  <div class="schemes-demo">
    <g-gantt-chart
      v-for="scheme in colorSchemes"
      :key="scheme"
      v-bind="chartConfig"
      :color-scheme="scheme"
      style="margin-bottom: 20px;"
    >
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
const colorSchemes = [
  'default',
  'vue',
  'dark',
  'creamy',
  'crimson'
]
</script>
```

## Custom Bar Styles

Example with custom bar styling:

```vue
<template>
  <g-gantt-chart v-bind="chartConfig">
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
    label: 'Custom Styles',
    bars: [
      {
        start: '2024-01-01',
        end: '2024-01-15',
        ganttBarConfig: {
          id: '1',
          label: 'Gradient Bar',
          style: {
            background: 'linear-gradient(45deg, #42b883, #35495e)',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      },
      {
        start: '2024-01-20',
        end: '2024-02-10',
        ganttBarConfig: {
          id: '2',
          label: 'Pattern Bar',
          style: {
            background: 'repeating-linear-gradient(45deg, #606dbc, #606dbc 10px, #465298 10px, #465298 20px)',
            color: 'white'
          }
        }
      }
    ]
  }
])
</script>
```

---

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

---

# Time Management Examples

This section demonstrates various time-related features.

## Different Time Precisions

```vue
<template>
  <div class="precision-demo">
    <select v-model="currentPrecision">
      <option v-for="p in precisions" :key="p" :value="p">
        {{ p }}
      </option>
    </select>

    <g-gantt-chart
      v-bind="chartConfig"
      :precision="currentPrecision"
    >
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
const precisions = ['hour', 'day', 'week', 'month']
const currentPrecision = ref('day')
</script>
```

## Current Time Indicator

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :current-time="true"
    current-time-label="Now"
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

---

# Advanced Examples

This section shows advanced usage patterns and complex scenarios.

## Drag Limits and Constraints

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :push-on-overlap="true"
    :no-overlap="true"
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
    label: 'Constrained Tasks',
    bars: [
      {
        start: '2024-01-01',
        end: '2024-01-15',
        ganttBarConfig: {
          id: '1',
          label: 'Immobile Task',
          immobile: true
        }
      },
      {
        start: '2024-01-16',
        end: '2024-01-30',
        ganttBarConfig: {
          id: '2',
          label: 'Movable Task',
          pushOnOverlap: true
        }
      }
    ]
  }
])
</script>
```

## Complex Project Example

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :enable-connections="true"
    :push-on-overlap="true"
    :push-on-connect="true"
  >
    <template #label-column-title>
      <div class="custom-header">
        Project Timeline
      </div>
    </template>

    <g-gantt-row
      v-for="row in rows"
      :key="row.label"
      :label="row.label"
      :bars="row.bars"
    >
      <template #bar-label="{ bar }">
        <div class="custom-bar-label">
          <div>{{ bar.ganttBarConfig.label }}</div>
          <div class="progress">
            {{ bar.progress }}%
          </div>
        </div>
      </template>
    </g-gantt-row>
  </g-gantt-chart>
</template>

<script setup lang="ts">
// Complex project data with dependencies and progress tracking
const rows = ref([
  {
    label: 'Planning',
    bars: [{
      start: '2024-01-01',
      end: '2024-01-15',
      progress: 100,
      ganttBarConfig: {
        id: '1',
        label: 'Requirements',
        connections: [{
          targetId: '2',
          type: 'bezier',
          animated: true
        }]
      }
    }]
  },
  // ... additional complex rows
])
</script>

<style scoped>
.custom-bar-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 8px;
}

.progress {
  font-size: 0.8em;
  color: #666;
}
</style>
```