<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'


const isLibraryReady = ref(false)
const currentPrecision = ref('hour')

const chartStart = ref('2024-12-05')
const chartEnd = ref('2025-02-28')

const rows = ref([
  {
    label: 'Project Alpha',
    bars: [
      {
        ganttBarConfig: {
          id: 'phase1',
          label: 'Phase 1',
          style: { background: '#FF6B6B' },
        },
        start: '2024-12-05',
        end: '2024-12-20',
      },
      {
        ganttBarConfig: {
          id: 'phase2',
          label: 'Phase 2',
          style: { background: '#4ECDC4' },
        },
        start: '2024-12-25',
        end: '2025-01-10',
      },
    ],
  },
  {
    label: 'Project Beta',
    bars: [
      {
        ganttBarConfig: {
          id: 'beta1',
          label: 'Planning',
          style: { background: '#96CEB4' },
        },
        start: '2024-12-10',
        end: '2024-12-30',
      },
      {
        ganttBarConfig: {
          id: 'beta2',
          label: 'Development',
          style: { background: '#9FA8DA' },
        },
        start: '2025-01-15',
        end: '2025-02-15',
      },
    ],
  },
])

onMounted(() => {
  isLibraryReady.value = true
})
</script>

<template>
  <ClientOnly>
    <div class="demo-container" v-if="isLibraryReady">
      <div class="controls">
        <select v-model="currentPrecision">
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      <g-gantt-chart
        :chart-start="chartStart"
        :chart-end="chartEnd"
        :precision="currentPrecision"
        bar-start="start"
        bar-end="end"
        :current-time="true"
        current-time-label="Hour"
        :enable-minutes="currentPrecision === 'hour'"
        label-column-title="Projects"
        color-scheme="vue"
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
  </ClientOnly>
</template>


<style scoped>
.demo-container {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.controls {
  margin-bottom: 20px;
}

.controls select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #eaeaea;
}
</style>