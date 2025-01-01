<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
const isLibraryReady = ref(false)

const rows = ref([
  {
    label: 'Frontend Core',
    bars: [
      {
        ganttBarConfig: {
          id: 'fe1',
          label: 'Core Setup',
          style: { background: '#FF6B6B' },
          connections: [
            { 
              targetId: 'fe2',
              type: 'bezier',
              animated: true,
              pattern: 'solid',
              color: '#FF6B6B'
            }
          ]
        },
        start: '2024-12-10 09:00',
        end: '2024-12-10 12:00',
      }
    ]
  },
  {
    label: 'Frontend Features',
    bars: [
      {
        ganttBarConfig: {
          id: 'fe2',
          label: 'Auth Module',
          style: { background: '#4ECDC4' },
          milestoneId: '1111',
          connections: [
            { 
              targetId: 'fe3',
              type: 'straight',
              animated: true,
              animationSpeed: 'fast',
              pattern: 'dash',
              color: '#4ECDC4'
            }
          ]
        },
        start: '2024-12-10 13:00',
        end: '2024-12-10 17:00',
      }
    ]
  },
  {
    label: 'Frontend Testing',
    bars: [
      {
        ganttBarConfig: {
          id: 'fe3',
          label: 'Unit Tests',
          style: { background: '#96CEB4' },
          connections: [
            {
              targetId: 'be1',
              type: 'squared',
              animated: true,
              pattern: 'dashdot',
              color: '#96CEB4'
            }
          ]
        },
        start: '2024-12-11 09:00',
        end: '2024-12-11 15:00',
      }
    ]
  },
  {
    label: 'Backend Setup',
    bars: [
      {
        ganttBarConfig: {
          id: 'be1',
          label: 'Initial Setup',
          style: { background: '#D4A5A5' },
          connections: [
            {
              targetId: 'be2',
              type: 'bezier',
              animated: true,
              pattern: 'dot',
              color: '#D4A5A5'
            }
          ]
        },
        start: '2024-12-11 10:00',
        end: '2024-12-11 16:00',
      }
    ]
  },
  {
    label: 'Backend Core',
    bars: [
      {
        ganttBarConfig: {
          id: 'be2',
          label: 'Core Services',
          style: { background: '#9FA8DA' },
          connections: [
            {
              targetId: 'be3',
              type: 'straight',
              animated: true,
              color: '#9FA8DA'
            }
          ]
        },
        start: '2024-12-11 13:00',
        end: '2024-12-11 18:00',
      }
    ]
  },
  {
    label: 'Backend API',
    bars: [
      {
        ganttBarConfig: {
          id: 'be3',
          label: 'API Development',
          style: { background: '#B39DDB' },
          connections: [
            {
              targetId: 'test1',
              type: 'squared',
              animated: false,
              pattern: 'dash',
              color: '#B39DDB'
            }
          ]
        },
        start: '2024-12-12 09:00',
        end: '2024-12-12 15:00',
      }
    ]
  },
  {
    label: 'Testing Phase 1',
    bars: [
      {
        ganttBarConfig: {
          id: 'test1',
          label: 'Integration Tests',
          style: { background: '#80DEEA' },
          connections: [
            {
              targetId: 'test2',
              type: 'bezier',
              animated: true,
              pattern: 'solid',
              color: '#80DEEA'
            }
          ]
        },
        start: '2024-12-12 10:00',
        end: '2024-12-12 16:00',
      }
    ]
  },
  {
    label: 'Testing Phase 2',
    bars: [
      {
        ganttBarConfig: {
          id: 'test2',
          label: 'E2E Tests',
          style: { background: '#81C784' },
          connections: [
            {
              targetId: 'deploy1',
              type: 'straight',
              animated: true,
              pattern: 'dot',
              color: '#81C784'
            }
          ]
        },
        start: '2024-12-12 13:00',
        end: '2024-12-12 18:00',
      }
    ]
  },
  {
    label: 'Deployment',
    bars: [
      {
        ganttBarConfig: {
          id: 'deploy1',
          label: 'Staging Deploy',
          style: { background: '#FFB74D' },
          connections: [
            {
              targetId: 'deploy2',
              type: 'bezier',
              animated: false,
              pattern: 'dashdot',
              color: '#FFB74D'
            }
          ]
        },
        start: '2024-12-13 09:00',
        end: '2024-12-13 12:00',
      },
            {
        ganttBarConfig: {
          id: 'deploy2',
          label: 'Production Deploy',
          style: { background: '#FF8A65' },
        },
        start: '2025-01-01 14:00',
        end: '2025-01-01 17:00',
      }
    ]
  },
  {
    label: 'Production',
    bars: [
      {
        ganttBarConfig: {
          id: 'deploy2',
          label: 'Production Deploy',
          style: { background: '#FF8A65' },
        },
        start: '2025-01-01 14:00',
        end: '2025-01-01 17:00',
      }
    ]
  }
])

const milestones = ref([
  {
    id: '1111',
    date: '2024-12-10 20:00',
    name: 'Project Launch',
    description: 'Official launch of the new platform',
  },
  {
    id: '1112',
    date: '2024-12-12',
    name: 'Year End Review',
    description: 'Final review of project milestones',
  },
])

onMounted(() => {
  isLibraryReady.value = true
})
</script>

<template>
  <ClientOnly>
    <div class="demo-container" v-if="isLibraryReady">
      <g-gantt-chart
        chart-start="2024-12-10 08:00"
        chart-end="2025-01-01 18:00"
        precision="hour"
        bar-start="start"
        bar-end="end"
        :max-rows="5"
        :push-on-connect="true"
        :push-on-overlap="true"
        :enable-connections="true"
        grid
        label-column-title="Rows"
        :dayOptionLabel="['day','name','doy']"
        :milestones="milestones"
        
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
</style>