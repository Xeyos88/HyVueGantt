// ConnectionsGanttDemo.vue
<template>
  <ClientOnly>
    <div class="demo-container" v-if="isLibraryReady">
      <g-gantt-chart
        chart-start="2024-12-10 08:00"
        chart-end="2024-12-13 23:00"
        precision="hour"
        bar-start="start"
        bar-end="end"
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
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

dayjs.extend(isSameOrBefore)

const isLibraryReady = ref(false)

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
        start: '2024-12-10 09:00',
        end: '2024-12-10 14:00',
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
        start: '2024-12-10 15:00',
        end: '2024-12-11 12:00',
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
        start: '2024-12-11 13:00',
        end: '2024-12-12 12:00',
      },
      {
        ganttBarConfig: {
          id: 'dev2',
          label: 'Testing',
          style: { background: '#D4A5A5' },
        },
        start: '2024-12-12 13:00',
        end: '2024-12-12 17:00',
      },
    ],
  },
])

onMounted(() => {
  isLibraryReady.value = true
})
</script>

<style scoped>
.demo-container {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}
</style>