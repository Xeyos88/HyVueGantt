<script setup lang="ts">
import { ref } from 'vue'
import { GGanttChart, GGanttRow, type ChartRow, type LabelColumnConfig } from 'hy-vue-gantt'

const chartStart = ref('2024-01-01')
const chartEnd = ref('2024-03-31')
const precision = ref('day')
const barStart = ref('start')
const barEnd = ref('end')

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

const rows = ref([
  {
    id: '1',
    label: 'Design Phase',
    bars: [
      {
        start: '2024-01-05',
        end: '2024-01-20',
        ganttBarConfig: {
          id: 'a1',
          label: 'UI/UX Design',
          style: { background: '#42b883' }
        }
      }
    ]
  },
  {
    id: '2',
    label: 'Development',
    bars: [
      {
        start: '2024-01-21',
        end: '2024-02-15',
        ganttBarConfig: {
          id: 'a2',
          label: 'Frontend Implementation',
          style: { background: '#35495e' }
        }
      }
    ]
  },
  {
    id: '3',
    label: 'Testing',
    bars: [
      {
        start: '2024-02-10',
        end: '2024-02-28',
        ganttBarConfig: {
          id: 'a3',
          label: 'QA and Testing',
          style: { background: '#ff7e67' }
        }
      }
    ]
  }
])
</script>

<template>
  <div class="demo-container">
    <g-gantt-chart
      :chart-start="chartStart"
      :chart-end="chartEnd"
      :precision="precision"
      :bar-start="barStart"
      :bar-end="barEnd"
      :row-height="40"
      :labelColumnWidth="100"
      grid
      label-column-title="Project Details"
      :multi-column-label="multiColumnLabel"
      sortable
      color-scheme="slumber"
      
    >
      <template #label-column-label="{ value }">
        <div class="custom-label">
          <span class="label-icon">📋</span>
          <span>{{ value }}</span>
        </div>
      </template>
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

<style scoped>
.demo-container {
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  margin: 20px 0;
}

h3 {
  margin-bottom: 20px;
  color: #42b883;
}
</style>