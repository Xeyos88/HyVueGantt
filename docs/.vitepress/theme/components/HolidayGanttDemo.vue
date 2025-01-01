<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

const isLibraryReady = ref(false)

const chartConfig = {
  chartStart: '2024-12-15',
  chartEnd: '2025-01-15',
  precision: 'hour',
  barStart: 'start',
  barEnd: 'end',
  colorScheme: 'vue',
  grid: true
}

const enableWeekends = ref(true)
const enableHolidays = ref('US')
const enableBusinessHours = ref(true)

const highlightedDaysInWeek = computed(() => 
  enableWeekends.value ? [0, 6] : [] 
)

const highlightedHours = computed(() => 
  enableBusinessHours.value ? [9, 10, 11, 12, 13, 14, 15, 16, 17] : []
)

const rows = ref([
  {
    label: 'Year End Activities',
    bars: [
      {
        ganttBarConfig: {
          id: 'task100',
          label: 'Planning',
          style: { background: '#42b883' }
        },
        start: '2024-12-16 00:00',
        end: '2024-12-20 23:59'
      },
      {
        ganttBarConfig: {
          id: 'task200',
          label: 'Implementation',
          style: { background: '#35495e' }
        },
        start: '2024-12-27',
        end: '2025-01-03'
      },
      {
        ganttBarConfig: {
          id: 'task300',
          label: 'Review',
          style: { background: '#ff7e67' }
        },
        start: '2025-01-06',
        end: '2025-01-10'
      }
    ]
  }
])

onMounted(() => {
  isLibraryReady.value = true
})
</script>

<template>
  <ClientOnly>
    <div class="demo-container" v-if="isLibraryReady">
      <div class="controls">
        <label class="control-item">
          <input type="checkbox" v-model="enableWeekends">
          Highlight Weekends
        </label>
        
        <label class="control-item">
          <select v-model="enableHolidays">
            <option value="">No Holidays</option>
            <option value="US">US Holidays</option>
            <option value="GB">UK Holidays</option>
            <option value="IT">Italian Holidays</option>
          </select>
        </label>
        
        <label class="control-item">
          <input type="checkbox" v-model="enableBusinessHours">
          Highlight Business Hours
        </label>
      </div>

      <g-gantt-chart
        v-bind="chartConfig"
        :highlighted-days-in-week="highlightedDaysInWeek"
        :highlighted-hours="highlightedHours"
        :holiday-highlight="enableHolidays"
      >
        <g-gantt-row
          v-for="row in rows"
          :key="row.label"
          :label="row.label"
          :bars="row.bars"
          :highlight-on-hover="true"
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
  display: flex;
  gap: 20px;
  align-items: center;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-item select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #eaeaea;
}

.control-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}
</style>