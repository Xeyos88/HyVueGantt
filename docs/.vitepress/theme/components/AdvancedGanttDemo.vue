<script setup lang="ts">
import { ref } from 'vue'
import { GGanttChart, GGanttRow, type ChartRow, type LabelColumnConfig } from 'hy-vue-gantt'

const year = new Date().getFullYear()
const month = new Date().getMonth() + 1
// Time Settings
const precision = ref('day')
const chartStart = ref(`${year}-${month}-01`)
const chartEnd = ref(`${year}-${month+2}-28`)
const dateFormat = ref('YYYY-MM-DD HH:mm')
const enableMinutes = ref(false)
const currentTime = ref(true)
const currentTimeLabel = ref('Now')

// Display Settings
const hideTimeaxis = ref(false)
const colorScheme = ref('vue')
const grid = ref(true)
const rowHeight = ref(40)
const font = ref('inherit')
const labelColumnTitle = ref('Project Tasks')
const labelColumnWidth = ref(200)
const commands = ref(true)
const width = ref('100%')

// Behavior Settings
const pushOnOverlap = ref(true)
const pushOnConnect = ref(true)
const noOverlap = ref(false)
const enableConnections = ref(true)
const sortable = ref(true)
const labelResizable = ref(true)
const enableRowDragAndDrop = ref(true)
const maxRows = ref(5)

// Available Options
const availableColorSchemes = [
  'default', 'vue', 'dark', 'creamy', 'crimson', 'flare', 
  'fuchsia', 'grove', 'material-blue', 'sky', 'slumber'
]



const availablePrecisions = ['hour', 'day', 'week', 'month']
const availableLocales = ['en', 'it', 'fr', 'de', 'es']

// Sample Data
const sampleData = ref([
  {
    id: 'group1',
    label: 'Frontend Development',
    children: [
      {
        id: 'task1',
        label: 'Setup Project',
        bars: [{
          start: `${year}-${month}-05`,
          end: `${year}-${month}-15`,
          ganttBarConfig: {
            id: 'bar1',
            label: 'Initial Setup',
            style: { background: '#42b883' },
            connections: [{
              targetId: 'bar2',
              type: 'bezier',
              animated: true
            }]
          }
        }]
      },
      {
        id: 'task2',
        label: 'Core Features',
        bars: [{
          start: `${year}-${month}-16`,
          end: `${year}-${month+1}-01`,
          ganttBarConfig: {
            id: 'bar2',
            label: 'Development',
            style: { background: '#35495e' }
          }
        }]
      }
    ]
  },
  {
    id: 'group2',
    label: 'Backend Development',
    children: [
      {
        id: 'task3',
        label: 'API Design',
        bars: [{
          start: `${year}-${month}-10`,
          end: `${year}-${month}-25`,
          ganttBarConfig: {
            id: 'bar3',
            label: 'API Planning',
            style: { background: '#ff7e67' }
          }
        },{
          start: `${year}-${month}-27`,
          end: `${year}-${month+1}-02`,
          ganttBarConfig: {
            id: 'bar3.1',
            label: 'API Planning V2',
            style: { background: '#ff7e67' }
          }
        }]
      },
      {
        id: 'task4',
        label: 'Database Setup',
        bars: [{
          start: `${year}-${month}-26`,
          end: `${year}-${month+1}-10`,
          ganttBarConfig: {
            id: 'bar4',
            label: 'DB Implementation',
            style: { background: '#4dc9ff' }
          }
        }]
      }
    ]
  }
])

// Event Handlers
const handleBarClick = (event: any) => {
  console.log('Bar clicked:', event)
}

const handleBarDrag = (event: any) => {
  console.log('Bar dragged:', event)
}

const handleSort = (event: any) => {
  console.log('Sort changed:', event)
}

const handleGroupExpansion = (event: any) => {
  console.log('Group toggled:', event)
}

const handleRowDrop = (event: any) => {
  console.log('Row dropped:', event)
}
</script>

<template>
  <div class="complete-demo">
    <!-- Settings Panel -->
    <div class="settings-panel">
      <h3>Gantt Chart Configuration</h3>
      
      <div class="settings-group">
        <h4>Time Settings</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label>
              Precision:
              <select v-model="precision">
                <option v-for="option in availablePrecisions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>
          </div>
          <div class="setting-item">
            <label>
              Enable Minutes:
              <input type="checkbox" v-model="enableMinutes">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Show Current Time:
              <input type="checkbox" v-model="currentTime">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Date Format:
              <input type="text" v-model="dateFormat">
            </label>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h4>Display Settings</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label>
              Color Scheme:
              <select v-model="colorScheme">
                <option v-for="option in availableColorSchemes" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>
          </div>
          <div class="setting-item">
            <label>
              Hide Timeaxis:
              <input type="checkbox" v-model="hideTimeaxis">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Show Grid:
              <input type="checkbox" v-model="grid">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Row Height:
              <input type="number" v-model="rowHeight">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Label Width:
              <input type="number" v-model="labelColumnWidth">
            </label>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h4>Behavior Settings</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label>
              Push on Overlap:
              <input type="checkbox" v-model="pushOnOverlap">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Push on Connect:
              <input type="checkbox" v-model="pushOnConnect">
            </label>
          </div>
          <div class="setting-item">
            <label>
              No Overlap:
              <input type="checkbox" v-model="noOverlap">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Enable Connections:
              <input type="checkbox" v-model="enableConnections">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Sortable:
              <input type="checkbox" v-model="sortable">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Label Resizable:
              <input type="checkbox" v-model="labelResizable">
            </label>
          </div>
          <div class="setting-item">
            <label>
              Enable Row Drag & Drop:
              <input type="checkbox" v-model="enableRowDragAndDrop">
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Gantt Container -->
    <div class="gantt-container">
      <g-gantt-chart
        :chart-start="chartStart"
        :chart-end="chartEnd"
        :precision="precision"
        bar-start="start"
        bar-end="end"
        :width="width"
        :hide-timeaxis="hideTimeaxis"
        :color-scheme="colorScheme"
        :grid="grid"
        :push-on-overlap="pushOnOverlap"
        :push-on-connect="pushOnConnect"
        :no-overlap="noOverlap"
        :row-height="rowHeight"
        :font="font"
        :label-column-title="labelColumnTitle"
        :label-column-width="labelColumnWidth"
        :commands="commands"
        :enable-minutes="enableMinutes"
        :enable-connections="enableConnections"
        :max-rows="maxRows"
        :current-time="currentTime"
        :current-time-label="currentTimeLabel"
        :date-format="dateFormat"
        :enable-row-drag-and-drop="enableRowDragAndDrop"
        :label-resizable="labelResizable"
        :sortable="sortable"
        @click-bar="handleBarClick"
        @drag-bar="handleBarDrag"
        @sort="handleSort"
        @group-expansion="handleGroupExpansion"
        @row-drop="handleRowDrop"
      >
        <g-gantt-row
          v-for="row in sampleData"
          :key="row.id"
          :id="row.id"
          :label="row.label"
          :bars="row.bars"
          :children="row.children"
          highlightOnHover
        />
      </g-gantt-chart>
    </div>
  </div>
</template>

<style scoped> 
h3, h4 {
  margin: 6px 0px;
}

.complete-demo {
  display: flex;
  gap: 20px;
  padding: 20px;
  flex-direction: column;
  font-size: 12px;
}

.settings-panel {
  background: #333;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  color: white;
}

.settings-group {
  margin-bottom: 16px;
}

.settings-group h4 {
  margin-bottom: 12px;
  color: #42b883;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.settings-grid {
  display: grid;
  gap: 8px;
}

.setting-item {
  display: flex;
}

.setting-item label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.setting-item select,
.setting-item input[type="text"],
.setting-item input[type="number"] {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #222;
  color: white;
}

.setting-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.gantt-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}
</style>