# Events Demo

Live demo of events issued by the Gantt component:

## Demo Live

<ClientOnly>
  <EventsGanttDemo />
</ClientOnly>

## Code

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GGanttChart, GGanttRow, type SortState } from 'hy-vue-gantt'

const currentEvent = ref('')

const rows = ref([
  {
    id: 'group1',
    label: 'Interactive Events',
    children: [
      {
        id: 'child1',
        label: 'Mouse Events',
        bars: [{
          ganttBarConfig: {
            id: 'bar1',
            label: 'Interactive Bar',
            hasHandles: true,
            style: {
              background: 'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
              borderRadius: '4px',
            }
          },
          start: '2024-12-10 09:00',
          end: '2024-12-10 14:00'
        }]
      },
      {
        id: 'child2',
        label: 'Drag Events',
        bars: [{
          ganttBarConfig: {
            id: 'bar2',
            label: 'Draggable Bar',
            hasHandles: true,
            style: {
              background: 'linear-gradient(45deg, #4ECDC4, #2EAF7D)',
              borderRadius: '4px',
            }
          },
          start: '2024-12-10 10:00',
          end: '2024-12-10 15:00'
        }]
      }
    ]
  },
  {
    id: 'group2',
    label: 'Connected Events',
    children: [
      {
        id: 'child3',
        label: 'Source Bar',
        bars: [{
          ganttBarConfig: {
            id: 'bar3',
            label: 'Source',
            style: { background: '#96CEB4' },
            connections: [{
              targetId: 'bar4',
              type: 'bezier',
              animated: true
            }]
          },
          start: '2024-12-10 11:00',
          end: '2024-12-10 16:00'
        }]
      },
      {
        id: 'child4',
        label: 'Target Bar',
        bars: [{
          ganttBarConfig: {
            id: 'bar4',
            label: 'Target',
            style: { background: '#D4A5A5' }
          },
          start: '2024-12-10 12:00',
          end: '2024-12-10 17:00'
        }]
      }
    ]
  }
])

const updateEvent = (type: string, event: any) => {
  currentEvent.value = `${type}: ${JSON.stringify(event, null, 2)}`
}

const handleClickBar = (event: any) => {
  updateEvent('Click', event)
}

const handleMouseEnterBar = (event: any) => {
  updateEvent('Mouse Enter', event)
}

const handleMouseLeaveBar = (event: any) => {
  updateEvent('Mouse Leave', event)
}

const handleDragStartBar = (event: any) => {
  updateEvent('Drag Start', event)
}

const handleDragBar = (event: any) => {
  updateEvent('Dragging', event)
}

const handleDragEndBar = (event: any) => {
  updateEvent('Drag End', event)
}

const handleSort = (event: { sortState: SortState }) => {
  updateEvent('Sort', event)
}

const handleGroupExpansion = (event: { rowId: string | number }) => {
  updateEvent('Group Toggle', event)
}

const handleRowDrop = (event: any) => {
  updateEvent('Row Drop', event)
}

</script>

<template>
  <div class="demo-container" v-if="isLibraryReady">
    <div class="gantt-section">
      <g-gantt-chart
        chart-start="2024-12-10 08:00"
        chart-end="2024-12-10 18:00"
        precision="hour"
        bar-start="start"
        bar-end="end"
        :push-on-overlap="true"
        :enable-row-drag-and-drop="true"
        grid
        color-scheme="vue"
        label-column-title="Event Testing"
        sortable
        @click-bar="handleClickBar"
        @mouseenter-bar="handleMouseEnterBar"
        @mouseleave-bar="handleMouseLeaveBar"
        @dragstart-bar="handleDragStartBar"
        @drag-bar="handleDragBar"
        @dragend-bar="handleDragEndBar"
        @sort="handleSort"
        @group-expansion="handleGroupExpansion"
        @row-drop="handleRowDrop"
      >
        <g-gantt-row
          v-for="row in rows"
          :key="row.id"
          :id="row.id"
          :label="row.label"
          :bars="row.bars || []"
          :children="row.children"
          highlightOnHover
        />
      </g-gantt-chart>
    </div>
    <div class="event-display" v-if="currentEvent">
      <div class="event-content">
        {{ currentEvent }}
      </div>
    </div>
  </div>
</template>
```