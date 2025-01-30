# Bar Slot Custom Demo 

Bar Slot Custom Live Demo for Hyper Vue Gantt:

## Live

<ClientOnly>
  <BarSlotGanttDemo />
</ClientOnly>

## Code

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

const isLibraryReady = ref(false)
const currentScheme = ref('default')

const rows = ref([
  {
    label: 'Marketing',
    bars: [
      {
        ganttBarConfig: {
          id: 'marketing1',
          label: 'Campaign Planning',
          hasHandles: true,
          style: {
            background: 'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
        },
        progress: 75,
        start: '2024-12-11',
        end: '2024-12-15',
      },
    ],
  },
  {
    label: 'Development',
    bars: [
      {
        ganttBarConfig: {
          id: 'dev1',
          label: 'Sprint 1',
          hasHandles: true,
          style: {
            background: 'linear-gradient(45deg, #4ECDC4, #2EAF7D)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
        },
        progress: 90,
        start: '2024-12-12',
        end: '2024-12-16',
      },
    ],
  },
])
</script>

<template>
  <div class="demo-container">
    <div class="custom-header">
      Theme:
      <select v-model="currentScheme">
        <option value="default">Default</option>
        <option value="vue">Vue</option>
        <option value="dark">Dark</option>
        <option value="creamy">Creamy</option>
      </select>
    </div>
    <g-gantt-chart
      chart-start="2024-12-11"
      chart-end="2024-12-17"
      precision="day"
      bar-start="start"
      bar-end="end" 
      :push-on-overlap="true"
      :no-overlap="true"
      grid
      :color-scheme="currentScheme"
      label-column-title="Projects"
    >
      <g-gantt-row
        v-for="row in rows"
        :key="row.label"
        :label="row.label"
        :bars="row.bars"
        highlightOnHover
      >
        <template #bar-label="{ bar }">
          <div class="custom-bar-label">
            <span>{{ bar.ganttBarConfig.label }}</span>
            <span class="progress">{{ bar.progress }}%</span>
          </div>
        </template>
      </g-gantt-row>
    </g-gantt-chart>
  </div>
</template>
```