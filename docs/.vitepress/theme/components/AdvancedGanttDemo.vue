<script setup lang="ts">
import { ref, computed } from 'vue'
import { GGanttChart, GGanttRow, type ChartRow, type LabelColumnConfig } from 'hy-vue-gantt'

const sections = ref<{ [key: string]: boolean }>({
  timeConfig: false,
  displayConfig: false,
  connectionConfig: false,
  behaviorConfig: false
})

const toggleSection = (section: string) => {
  sections.value[section] = !sections.value[section]
}

const year = new Date().getFullYear()
const month = new Date().getMonth() + 1

// Time Configuration
const precision = ref('day')
const chartStart = ref(`${year}-${month}-01`)
const chartEnd = ref(`${year}-${month+2}-28`)
const dateFormat = ref('YYYY-MM-DD HH:mm')
const enableMinutes = ref(false)
const currentTime = ref(true)
const currentTimeLabel = ref('Now')
const locale = ref('en')

// Display Configuration
const hideTimeaxis = ref(false)
const colorScheme = ref('dark')
const grid = ref(true)
const rowHeight = ref(40)
const font = ref('inherit')
const labelColumnTitle = ref('Project Tasks')
const labelColumnWidth = ref(100)
const commands = ref(true)
const width = ref('100%')


// Time Highlight Configuration
const highlightedHours = ref([9, 13, 17])
const highlightedDaysInWeek = ref([0, 6]) // Sunday and Saturday
const holidayHighlight = ref('US')
const dayOptionLabel = ref(['day', 'name', 'doy'])

// Connection Configuration
const defaultConnectionType = ref('bezier')
const defaultConnectionPattern = ref('solid')
const defaultConnectionAnimationSpeed = ref('normal')
const defaultConnectionAnimated = ref(false)
const defaultConnectionColor = ref('#ff0000')
const markerConnection = ref('forward')

// Behavior Configuration
const pushOnOverlap = ref(true)
const pushOnConnect = ref(true)
const noOverlap = ref(false)
const enableConnections = ref(true)
const sortable = ref(true)
const labelResizable = ref(true)
const enableRowDragAndDrop = ref(true)
const maxRows = ref(5)

const multiColumnOptions = ['Label','StartDate','EndDate','Id','Duration']
const columnsSelected = ref(["Label"])
const multiColumnLabel = computed(() =>  columnsSelected.value.map((el) => {return {
  field: el, sortable: sortable.value
}})

) 

// Available Options
const availableColorSchemes = [
  'default', 'vue', 'dark', 'creamy', 'crimson', 'flare', 
  'fuchsia', 'grove', 'material-blue', 'sky', 'slumber'
]

const availablePrecisions = ['hour', 'day', 'week', 'month']
const availableLocales = ['en', 'it', 'fr', 'de', 'es']
const availableConnectionTypes = ['bezier', 'straight', 'squared']
const availableConnectionPatterns = ['solid', 'dash', 'dot', 'dashdot']
const availableConnectionSpeeds = ['slow', 'normal', 'fast']
const availableMarkerTypes = ['none', 'forward', 'bidirectional']
const availableDayOptions = ['day', 'name', 'doy', 'number']


// Event Logging
const eventLog = ref<Array<{type: string, data: any, timestamp: number}>>([])
const maxEventLogs = 5

const addEventLog = (type: string, data: any) => {
  eventLog.value.unshift({
    type,
    data,
    timestamp: Date.now()
  })
  
  if (eventLog.value.length > maxEventLogs) {
    eventLog.value = eventLog.value.slice(0, maxEventLogs)
  }
}

// Event Handlers with Logging
const handleBarClick = (event: any) => {
  addEventLog('Bar Click', event)
}

const handleBarDrag = (event: any) => {
  addEventLog('Bar Drag', event)
}

const handleSort = (event: any) => {
  addEventLog('Sort Change', event)
}

const handleGroupExpansion = (event: any) => {
  addEventLog('Group Toggle', event)
}

const handleRowDrop = (event: any) => {
  addEventLog('Row Drop', event)
}

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

// Computed property to format event log output
const formattedEventLog = computed(() => {
  return eventLog.value.map(event => {
    const time = new Date(event.timestamp).toLocaleTimeString()
    return {
      ...event,
      formattedTime: time
    }
  })
})
</script>

<template>
  <div class="complete-demo">
    <!-- Settings Panel -->
    <div class="settings-container">
      <div class="settings-column">
        <div class="settings-group">
          <h4 @click="toggleSection('timeConfig')" class="toggle-header">Time Settings 
            <span :class="{'arrow-down': sections.timeConfig, 'arrow-up': !sections.timeConfig}">▼</span>
          </h4>
          <div v-if="sections.timeConfig" class="settings-grid">
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
                Day Label:
                <select v-model="dayOptionLabel" multiple>
                  <option v-for="option in availableDayOptions" :key="option" :value="option" >
                    {{ option }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Language:
                <select v-model="locale">
                  <option v-for="option in availableLocales" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Holidays:
                <select v-model="holidayHighlight">
                  <option value="">None</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="IT">Italy</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Highlighted Hours:
                <input 
                  type="text" 
                  :value="highlightedHours.join(',')" 
                  @input="e => highlightedHours = (e.target as HTMLInputElement).value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))"
                  placeholder="9,13,17"
                >
              </label>
            </div>
            <div class="setting-item">
              <label>
                Highlighted Days:
                <input 
                  type="text" 
                  :value="highlightedDaysInWeek.join(',')" 
                  @input="e => highlightedDaysInWeek = (e.target as HTMLInputElement).value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))"
                  placeholder="0,6"
                >
              </label>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h4 @click="toggleSection('connectionConfig')" class="toggle-header">Connection Settings
            <span :class="{'arrow-down': sections.connectionConfig, 'arrow-up': !sections.connectionConfig}">▼</span>
          </h4>
          <div v-if="sections.connectionConfig" class="settings-grid">
            <div class="setting-item">
              <label>
                Animated:
                <input type="checkbox" v-model="defaultConnectionAnimated">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Connection Type:
                <select v-model="defaultConnectionType">
                  <option v-for="type in availableConnectionTypes" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Pattern:
                <select v-model="defaultConnectionPattern">
                  <option v-for="pattern in availableConnectionPatterns" :key="pattern" :value="pattern">
                    {{ pattern }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Animation Speed:
                <select v-model="defaultConnectionAnimationSpeed">
                  <option v-for="speed in availableConnectionSpeeds" :key="speed" :value="speed">
                    {{ speed }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Connection Color:
                <input type="color" v-model="defaultConnectionColor"/>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Marker Type:
                <select v-model="markerConnection">
                  <option v-for="marker in availableMarkerTypes" :key="marker" :value="marker">
                    {{ marker }}
                  </option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-column">
        <div class="settings-group">
          <h4 @click="toggleSection('displayConfig')" class="toggle-header">Display Settings
            <span :class="{'arrow-down': sections.displayConfig, 'arrow-up': !sections.displayConfig}">▼</span>
          </h4>
          <div v-if="sections.displayConfig" class="settings-grid">
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
                Label Columns:
                <select v-model="columnsSelected" multiple>
                  <option v-for="option in multiColumnOptions" :key="option" :value="option" >
                    {{ option }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Hide Timeline:
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
                Max Rows:
                <input type="number" v-model="maxRows">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Commands:
                <input type="checkbox" v-model="commands">
              </label>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h4 @click="toggleSection('behaviorConfig')" class="toggle-header">Behavior Settings
            <span :class="{'arrow-down': sections.behaviorConfig, 'arrow-up': !sections.behaviorConfig}">▼</span>
          </h4>
          <div v-if="sections.behaviorConfig" class="settings-grid">
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
                Prevent Overlap:
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
    </div>

    <!-- Gantt Container -->
    <div class="gantt-container">
      <g-gantt-chart
        :chart-start="chartStart"
        :chart-end="chartEnd"
        :precision="precision"
        :locale="locale"
        bar-start="start"
        bar-end="end"
        :width="width"
        :hide-timeaxis="hideTimeaxis"
        :color-scheme="colorScheme"
        :multi-column-label="multiColumnLabel"
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
        :highlighted-hours="highlightedHours"
        :highlighted-days-in-week="highlightedDaysInWeek"
        :holiday-highlight="holidayHighlight"
        :day-option-label="dayOptionLabel"
        :default-connection-type="defaultConnectionType"
        :default-connection-pattern="defaultConnectionPattern"
        :default-connection-animation-speed="defaultConnectionAnimationSpeed"
        :default-connection-animated="defaultConnectionAnimated"
        :default-connection-color="defaultConnectionColor"
        :marker-connection="markerConnection"
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

      <!-- Event Log Panel -->
      <div class="event-log">
        <h4>Event Log</h4>
        <div class="event-list">
          <div v-for="event in formattedEventLog" :key="event.timestamp" class="event-item">
            <span class="event-time">{{ event.formattedTime }}</span>
            <span class="event-type">{{ event.type }}</span>
            <pre class="event-data">{{ JSON.stringify(event.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.complete-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  font-size: 12px;
  background: #1a1a1a;
  color: white;
}

.settings-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.settings-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-group {
  background: #333;
  padding: 16px;
  border-radius: 6px;
}

.settings-group h4 {
  margin: 0 0 16px 0;
  color: #42b883;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
  font-size: 14px;
}

.settings-grid {
  display: grid;
  gap: 12px;
}

.setting-item {
  display: flex;
}

.setting-item label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.setting-item select,
.setting-item input[type="text"],
.setting-item input[type="number"] {
  width: 140px;
  padding: 6px 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #222;
  color: white;
  font-size: 12px;
}

.setting-item input[type="color"] {
  width: 140px;
  height: 24px;
}

.setting-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #42b883;
}

.gantt-container {
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.event-log {
  background: #2a2a2a;
  padding: 16px;
  border-radius: 0 0 8px 8px;
}

.event-log h4 {
  margin: 0 0 12px 0;
  color: #42b883;
  font-size: 14px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.event-item {
  background: #333;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
}

.event-time {
  color: #42b883;
  margin-right: 12px;
}

.event-type {
  color: #4dc9ff;
  margin-right: 12px;
}

.event-data {
  margin: 8px 0 0 0;
  padding: 8px;
  background: #222;
  border-radius: 4px;
  color: #ddd;
  font-family: monospace;
  white-space: pre-wrap;
  overflow-x: auto;
}

.toggle-header {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arrow-down {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

.arrow-up {
  transition: transform 0.3s ease;
}

@media (max-width: 1200px) {
  .settings-container {
    grid-template-columns: 1fr;
  }
}
</style>
        