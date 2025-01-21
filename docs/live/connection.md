# Connetions Demo 

Connections Live Demo for Hyper Vue Gantt:

## Live

<ClientOnly>
  <ConnectionsGanttDemo />
</ClientOnly>

## Code

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

const rows = ref([
  {
    label: 'Design Phase',
    bars: [
      {
        ganttBarConfig: {
          id: 'design1',
          label: 'Wireframes',
          style: { background: '#FF6B6B' },
          connections: [
            { 
              targetId: 'design2',
              type: 'bezier',
              animated: true,
              color: '#FF6B6B' 
            }
          ]
        },
        start: '2024-12-25 09:00',
        end: '2024-12-25 14:00',
      },
      {
        ganttBarConfig: {
          id: 'design2',
          label: 'UI Design',
          style: { background: '#4ECDC4' },
          connections: [
            { 
              targetId: 'dev1',
              type: 'squared',
              pattern: 'dash',
              color: '#4ECDC4' 
            }
          ]
        },
        start: '2024-12-25 15:00',
        end: '2024-12-26 12:00',
      },
    ],
  },
  {
    label: 'Development',
    bars: [
      {
        ganttBarConfig: {
          id: 'dev1',
          label: 'Frontend Implementation',
          style: { background: '#96CEB4' },
          connections: [
            { 
              targetId: 'dev2',
              type: 'straight',
              animated: true,
              color: '#96CEB4' 
            }
          ]
        },
        start: '2024-12-26 13:00',
        end: '2024-12-26 14:00',
      },
      {
        ganttBarConfig: {
          id: 'dev2',
          label: 'Testing',
          style: { background: '#D4A5A5' },
        },
        start: '2024-12-26 13:00',
        end: '2024-12-26 17:00',
      },
    ],
  },
])
</script>

<template>
  <div class="demo-container" v-if="isLibraryReady">
    <g-gantt-chart
      chart-start="2024-12-25 08:00"
      chart-end="2024-12-27 23:00"
      precision="hour"
      bar-start="start"
      bar-end="end"
      :enable-connections="true"
      :push-on-connect="true"
      color-scheme="dark"
      :holidayHighlight="'US'"
    >
      <g-gantt-row
        v-for="row in rows"
        :key="row.label"
        :label="row.label"
        :bars="row.bars"
        highlightOnHover
      />
    </g-gantt-chart>
  </div>
</template>
```