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

## Planned vs Actual Timeline Tracking

The planned bars feature allows you to visualize both planned and actual timelines for project tracking and variance analysis:

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :show-planned-bars="true"
  >
    <g-gantt-row
      v-for="row in projectRows"
      :key="row.label"
      :label="row.label"
      :bars="row.bars"
    />
  </g-gantt-chart>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const chartConfig = ref({
  chartStart: '2024-01-01',
  chartEnd: '2024-03-31',
  precision: 'day',
  barStart: 'start',
  barEnd: 'end'
})

const projectRows = ref([
  {
    label: 'Planning Phase',
    bars: [{
      start: '2024-01-03',           // Actual started 2 days late
      end: '2024-01-18',             // Finished 3 days late
      start_planned: '2024-01-01',   // Originally planned start
      end_planned: '2024-01-15',     // Originally planned end
      ganttBarConfig: {
        id: 'planning',
        label: 'Requirements & Design',
        style: {
          backgroundColor: '#4caf50',
          color: 'white'
        },
        plannedStyle: {
          backgroundColor: '#e8f5e8',
          border: '2px dashed #4caf50',
          opacity: 0.6
        }
      }
    }]
  },
  {
    label: 'Development',
    bars: [{
      start: '2024-01-20',           // Started on time
      end: '2024-02-25',             // Running 5 days over
      start_planned: '2024-01-20',   // Planned start
      end_planned: '2024-02-20',     // Planned end
      ganttBarConfig: {
        id: 'development',
        label: 'Core Implementation',
        style: {
          backgroundColor: '#2196f3',
          color: 'white'
        },
        plannedStyle: {
          backgroundColor: '#e3f2fd',
          border: '2px dashed #2196f3',
          opacity: 0.6
        }
      }
    }]
  },
  {
    label: 'Testing',
    bars: [{
      start: '2024-03-01',           // Delayed start due to dev overrun
      end: '2024-03-20',             // Compressed timeline
      start_planned: '2024-02-25',   // Originally planned earlier
      end_planned: '2024-03-15',     // Originally shorter duration
      ganttBarConfig: {
        id: 'testing',
        label: 'QA & Bug Fixes',
        style: {
          backgroundColor: '#ff9800',
          color: 'white'
        },
        plannedStyle: {
          backgroundColor: '#fff3e0',
          border: '2px dashed #ff9800',
          opacity: 0.6
        }
      }
    }]
  }
])
</script>
```

### Project Variance Analysis Example

```vue
<template>
  <div class="project-dashboard">
    <h3>Project Dashboard with Variance Tracking</h3>
    
    <!-- Summary Stats -->
    <div class="variance-summary">
      <div class="stat-card">
        <strong>Total Delay:</strong> {{ calculateTotalDelay() }} days
      </div>
      <div class="stat-card">
        <strong>Tasks Over Budget:</strong> {{ tasksOverBudget() }}
      </div>
    </div>

    <g-gantt-chart
      v-bind="chartConfig"
      :show-planned-bars="true"
      @click-bar="handleBarClick"
    >
      <g-gantt-row
        v-for="row in varianceRows"
        :key="row.label"
        :label="row.label"
        :bars="row.bars"
      >
        <template #bar-tooltip="{ bar, barStart, barEnd }">
          <div class="variance-tooltip">
            <h4>{{ bar.ganttBarConfig.label }}</h4>
            <div><strong>Actual:</strong> {{ barStart }} → {{ barEnd }}</div>
            <div v-if="bar.start_planned">
              <strong>Planned:</strong> {{ bar.start_planned }} → {{ bar.end_planned }}
            </div>
            <div class="variance-info">
              <strong>Variance:</strong> 
              <span :class="getVarianceClass(bar)">
                {{ calculateVariance(bar) }}
              </span>
            </div>
          </div>
        </template>
      </g-gantt-row>
    </g-gantt-chart>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const varianceRows = ref([
  {
    label: 'Frontend Development',
    bars: [{
      start: '2024-01-10',
      end: '2024-02-15',
      start_planned: '2024-01-05',
      end_planned: '2024-02-05',
      ganttBarConfig: {
        id: 'frontend',
        label: 'React Components',
        plannedStyle: {
          backgroundColor: '#ffebee',
          border: '2px dashed #f44336',
          opacity: 0.7
        }
      }
    }]
  },
  {
    label: 'Backend API',
    bars: [{
      start: '2024-01-08',
      end: '2024-01-28',
      start_planned: '2024-01-10',
      end_planned: '2024-02-10',
      ganttBarConfig: {
        id: 'backend',
        label: 'REST API Development',
        plannedStyle: {
          backgroundColor: '#e8f5e8',
          border: '2px dashed #4caf50',
          opacity: 0.7
        }
      }
    }]
  }
])

function calculateVariance(bar) {
  if (!bar.start_planned || !bar.end_planned) return 'N/A'
  
  const actualDuration = dayjs(bar.end).diff(dayjs(bar.start), 'days')
  const plannedDuration = dayjs(bar.end_planned).diff(dayjs(bar.start_planned), 'days')
  const variance = actualDuration - plannedDuration
  
  return variance > 0 ? `+${variance} days` : `${variance} days`
}

function getVarianceClass(bar) {
  if (!bar.start_planned) return ''
  const variance = dayjs(bar.end).diff(dayjs(bar.end_planned), 'days')
  return variance > 0 ? 'over-budget' : variance < 0 ? 'under-budget' : 'on-time'
}

function calculateTotalDelay() {
  return varianceRows.value.reduce((total, row) => {
    return total + row.bars.reduce((rowTotal, bar) => {
      const delay = bar.start_planned 
        ? Math.max(0, dayjs(bar.end).diff(dayjs(bar.end_planned), 'days'))
        : 0
      return rowTotal + delay
    }, 0)
  }, 0)
}

function tasksOverBudget() {
  return varianceRows.value.reduce((count, row) => {
    return count + row.bars.filter(bar => 
      bar.start_planned && dayjs(bar.end).isAfter(dayjs(bar.end_planned))
    ).length
  }, 0)
}

function handleBarClick({ bar }) {
  console.log('Bar clicked:', bar.ganttBarConfig.label)
  // Handle bar interaction
}
</script>

<style scoped>
.project-dashboard {
  padding: 20px;
}

.variance-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.variance-tooltip {
  padding: 10px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.variance-info {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.over-budget { color: #f44336; font-weight: bold; }
.under-budget { color: #4caf50; font-weight: bold; }
.on-time { color: #2196f3; font-weight: bold; }
</style>
```

## Multi Label Columns

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :push-on-overlap="true"
    :no-overlap="true"
    label-column-title="Project Details"
    :multi-column-label="multiColumnLabel"
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

const getN = (row: ChartRow) => {
  return row.bars.length
}

const sortN = (a: ChartRow, b: ChartRow) => {
  const aId = a.bars.length ?? 0
  const bId = b.bars.length ?? 0
  return aId < bId ? -1 : aId > bId ? 1 : 0
}


const multiColumnLabel = ref<LabelColumnConfig[]>([
  {
    field: 'Id',
    sortable: false,
  },
  {
    field: 'Label',
  },
  {
    field: 'StartDate',
  },
  {
    field: 'Duration',
  },
  {
    field: 'Bars N°',
    valueGetter: getN,
    sortFn: sortN,
  },
])
</script>
```