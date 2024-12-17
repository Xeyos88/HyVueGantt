<template>
  <ClientOnly>
    <div class="demo-container" v-if="isLibraryReady">
      <g-gantt-chart
        chart-start="2024-12-10 08:00"
        chart-end="2024-12-13 23:00"
        precision="hour"
        bar-start="start"
        bar-end="end"
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
    label: 'Frontend Team',
    bars: [
      {
        ganttBarConfig: {
          id: 'task1',
          label: 'Project Setup',
          immobile: true,
          style: { background: '#FF6B6B' },
        },
        start: '2024-12-10 09:00',
        end: '2024-12-10 12:00',
      },
      {
        ganttBarConfig: {
          id: 'task2',
          label: 'Router Configuration',
          style: { background: '#4ECDC4' },
        },
        start: '2024-12-10 13:00',
        end: '2024-12-10 17:00',
      },
      {
        ganttBarConfig: {
          id: 'task3',
          label: 'Store Implementation',
          style: { background: '#96CEB4' },
        },
        start: '2024-12-11 09:00',
        end: '2024-12-11 16:00',
      },
    ],
  },
  {
    label: 'Backend Team',
    bars: [
      {
        ganttBarConfig: {
          id: 'task4',
          label: 'Setup Database',
          immobile: true,
          style: { background: '#D4A5A5' },
        },
        start: '2024-12-10 09:00',
        end: '2024-12-10 15:00',
      },
      {
        ganttBarConfig: {
          id: 'task5',
          label: 'API Development',
          style: { background: '#9FA8DA' },
        },
        start: '2024-12-10 15:30',
        end: '2024-12-11 12:00',
      },
      {
        ganttBarConfig: {
          id: 'task6',
          label: 'Testing APIs',
          style: { background: '#B39DDB' },
        },
        start: '2024-12-11 13:00',
        end: '2024-12-11 17:00',
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