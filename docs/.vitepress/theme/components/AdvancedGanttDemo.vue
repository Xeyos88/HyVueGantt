<script setup lang="ts">
import { ref, computed } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import type { ConnectionType, ConnectionSpeed, MarkerConnection, TimeUnit, DayOptionLabel, ConnectionPattern, GanttBarObject, ChartRow, ExportOptions, ImportResult } from 'hy-vue-gantt'
import { downloadSampleCSV } from './CSVGenerator'
import {downloadSampleJIRA} from './JIRAGEnerator'

const sections = ref<{ [key: string]: boolean }>({
  timeConfig: false,
  displayConfig: false,
  connectionConfig: false,
  behaviorConfig: false,
  slotsConfig: false,
  exportConfig: false,
  importConfig: false
})

const showImporter = ref(false)

const toggleSection = (section: string) => {
  sections.value[section] = !sections.value[section]
}

const year = new Date().getFullYear()
const month = new Date().getMonth() + 1

// Time Configuration
const precision = ref<TimeUnit>('day')
const chartStart = ref(`${year}-${month}-01`)
const chartEnd = ref(`${year}-${month+2}-28`)
const dateFormat = ref('YYYY-MM-DD HH:mm')
const enableMinutes = ref(false)
const currentTime = ref(true)
const currentTimeLabel = ref('Now')
const pointerMarker = ref(true)
const locale = ref('en')
const utc = ref(false)


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
const showLabel = ref(true)
const barLabelEditable = ref(true)
const showProgress = ref(true)
const showEventsAxis = ref(true)
const eventsAxisHeight = ref(30)


// Time Highlight Configuration
const highlightedHours = ref([9, 13, 17])
const highlightedDaysInWeek = ref([0, 6]) // Sunday and Saturday
const holidayHighlight = ref('US')
const dayOptionLabel = ref<DayOptionLabel[]>(['day', 'name', 'doy'])

// Connection Configuration
const defaultConnectionType = ref<ConnectionType>('bezier')
const defaultConnectionPattern = ref<ConnectionPattern>('solid')
const defaultConnectionAnimationSpeed = ref<ConnectionSpeed>('normal')
const defaultConnectionAnimated = ref(false)
const defaultConnectionColor = ref('#ff0000')
const markerConnection = ref<MarkerConnection>('forward')

// Behavior Configuration
const pushOnOverlap = ref(true)
const pushOnConnect = ref(true)
const noOverlap = ref(false)
const enableConnections = ref(true)
const sortable = ref(true)
const labelResizable = ref(true)
const enableRowDragAndDrop = ref(true)
const maxRows = ref(5)
const defaultProgressResizable = ref(true)
const enableConnectionCreation = ref(true)
const enableConnectionDeletion = ref(true)

// Export Configuration
const exportEnabled = ref(true)
const exportFormat = ref<'pdf' | 'png' | 'svg' | 'excel'>('pdf')
const exportQuality = ref(0.95)
const exportPaperSize = ref<'a4' | 'a3' | 'letter' | 'legal'>('a4')
const exportOrientation = ref<'portrait' | 'landscape'>('landscape')
const exportScale = ref(1.5)
const exportColumnLabel = ref(true)
const exportMargin = ref(10)

// Computed export options object
const exportOptions = computed<ExportOptions>(() => ({
  format: exportFormat.value,
  quality: exportQuality.value,
  paperSize: exportPaperSize.value,
  orientation: exportOrientation.value,
  scale: exportScale.value,
  margin: exportMargin.value,
  filename: `gantt-export-${new Date().toISOString().slice(0, 10)}`,
  exportColumnLabel: exportColumnLabel.value
}))

const multiColumnOptions = ['Label','StartDate','EndDate','Id','Duration', 'Progress']
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
const availableExportFormats = ['pdf', 'png', 'svg', 'excel']
const availablePaperSizes = ['a4', 'a3', 'letter', 'legal']
const availableOrientations = ['portrait', 'landscape']
// Slot Customization Settings
const customSlots = ref({
  commands: false,
  barLabel: false,
  barTooltip: false,
  currentTimeLabel: false,
  pointerMarkerTooltips: false,
  upperTimeunit: false,
  labelColumnTitle: false,
  timeunit: false,
  holidayTooltip: false,
  eventTooltip: false,
  timeaxisEvent: false,
  groupBar: false,
  milestone: false,
  labelColumnField: false
})

// Custom Styles
const customCommandStyle = ref({
  borderRadius: '4px',
  gap: '12px',
})

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
const handleEvent = (event: any, type: string) => {
  addEventLog(type, event)
}

const handleImport = (result: ImportResult) => {
  if (result.success && result.data) {
    showImporter.value = false
    
    /*if (result.data.chartStart) {
      chartStart.value = result.data.chartStart instanceof Date 
        ? result.data.chartStart.toISOString().split('T')[0] 
        : result.data.chartStart.split('T')[0]
    }
    
    if (result.data.chartEnd) {
      chartEnd.value = result.data.chartEnd instanceof Date 
        ? result.data.chartEnd.toISOString().split('T')[0] 
        : result.data.chartEnd.split('T')[0]
    }*/
    
    addEventLog('Import', { 
      success: true,
      rowsCount: result.data.rows.length,
      warnings: result.warnings?.length || 0 
    })
  } else {
    addEventLog('Importazione Fallita', { 
      error: result.error 
    })
  }
}

export type ChartRowWithOptionalBars = Omit<ChartRow, "bars"> & { bars?: GanttBarObject[] };


// Sample Data
const sampleData = ref<ChartRowWithOptionalBars[]>([
  {
    id: 'group1',
    label: 'Frontend Development',
    children: [
      {
        id: 'task1',
        label: 'Setup Project',
        bars: [{
          start: `${year}-${month}-02`,
          end: `${year}-${month}-10`,
          ganttBarConfig: {
            id: 'bar1',
            label: 'Initial Setup',
            style: { background: '#42b883' },
            progress: 100,
            connections: [{
              targetId: 'bar2',
              relation: 'SS'
            }]
          }
        }]
      },
      {
        id: 'task2',
        label: 'Core Features',
        bars: [{
          start: `${year}-${month}-11`, 
          end: `${year}-${month}-20`,
          ganttBarConfig: {
            id: 'bar2',
            label: 'Development',
            style: { background: '#35495e' },
            progress: 75,
            connections: [{
              targetId: 'bar3',
              pattern: 'dash'
            }]
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
          start: `${year}-${month}-21`,
          end: `${year}-${month}-28`,
          ganttBarConfig: {
            id: 'bar3',
            label: 'API Planning',
            style: { background: '#ff7e67' },
            hasHandles: true,
            progress: 60,
            connections: [{
              targetId: 'bar4',
            }]
          }
        }]
      },
      {
        id: 'task4',
        label: 'Database Setup',
        bars: [
          {
            start: `${year}-${month+1}-01`,
            end: `${year}-${month+1}-10`,
            ganttBarConfig: {
              id: 'bar4',
              label: 'DB Implementation',
              style: { background: '#4dc9ff' },
              hasHandles: true,
              progress: 30,
              connections: [{
                targetId: 'bar7',
                type: 'squared'
              }]
            }
          },
          {
            start: `${year}-${month+1}-11`,
            end: `${year}-${month+1}-20`, 
            ganttBarConfig: {
              id: 'bar5',
              label: 'DB Optimization',
              style: { background: '#34495e' },
              progress: 0,
            }
          }
        ]
      }
    ]
  },
  {
    id: 'group3',
    label: 'Progress Examples',
    children: [
      {
        id: 'progress1',
        label: 'Progress States',
        bars: [
          {
            start: `${year}-${month+1}-21`,
            end: `${year}-${month+1}-25`,
            ganttBarConfig: {
              id: 'bar7',
              label: 'In Progress',
              style: { background: '#e67e22' },
              progress: 50,
              progressResizable: true,
              connections: [{
                targetId: 'bar9',
                type: 'bezier'
              }]
            }
          },
          {
            start: `${year}-${month+1}-26`,
            end: `${year}-${month+1}-30`,
            ganttBarConfig: {
              id: 'bar8',
              label: 'Completed',
              style: { background: '#27ae60' },
              progress: 100,
              progressResizable: true
            }
          }
        ]
      }
    ]
  },
  {
    id: 'group4',
    label: 'Bundle Example',
    children: [
      {
        id: 'bundle1',
        label: 'Connected Tasks',
        bars: [
          {
            start: `${year}-${month+2}-01`,
            end: `${year}-${month+2}-10`,
            ganttBarConfig: {
              id: 'bar9',
              label: 'Task A',
              style: { background: '#8e44ad' },
              bundle: 'bundle1',
              progress: 45,
              connections: [{
                targetId: 'milestone1',
                pattern: 'dot'
              }]
            }
          }
        ]
      },
      {
        id: 'bundle2',
        label: 'Parallel Tasks',
        bars: [
          {
            start: `${year}-${month+2}-01`, 
            end: `${year}-${month+2}-10`,
            ganttBarConfig: {
              id: 'bar10',
              label: 'Task B',
              milestoneId: 'milestone1',
              style: { background: '#8e44ad' },
              bundle: 'bundle1',
              progress: 45,
              connections: [{
                targetId: 'milestone1',
                pattern: 'dashdot'
              }]
            }
          }
        ]
      }
    ]
  },
  {
    id: 'group5',
    label: 'Final Milestone',
    children: [
      {
        id: 'milestone',
        label: 'Project Completion',
        bars: [{
          start: `${year}-${month+2}-15`,
          end: `${year}-${month+2}-15 01:00`,
          ganttBarConfig: {
            id: 'milestone1',
            label: 'Release v1.0',
            style: { 
              background: '#2ecc71',
              borderRadius: '50%',
              width: '24px',
              height: '24px'
            }
          }
        }]
      }
    ]
  }
])

const events = ref([
  {
    id: 'visibility-1',
    label: 'First develop period',
    startDate: `${year}-${month}-02 15:00`,
    endDate: `${year}-${month}-03 17:00`,
    description: 'First custom event period'
  },
  {
    id: 'visibility-2',
    label: 'Second develop period',
    startDate: `${year}-${month}-05 05:00`,
    endDate: `${year}-${month}-08 12:00`,
    description: 'Second custom event period'
  }
]);

const milestones = ref([
  {
    id: 'milestone1',
    date: `${year}-${month+2}-15`,
    name: 'Project End',
    description: 'Official launch of the new platform',
  },
  {
    id: 'milestone2',
    date: `${year}-${month+1}-15`,
    name: 'Project Review',
    description: 'Official review',
  },
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
            <div class="setting-item">
              <label>
                UTC Current time:
                <input type="checkbox" v-model="utc">
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

        <div class="settings-group">
          <h4 @click="toggleSection('exportConfig')" class="toggle-header">Export Settings
            <span :class="{'arrow-down': sections.exportConfig, 'arrow-up': !sections.exportConfig}">▼</span>
          </h4>
          <div v-if="sections.exportConfig" class="settings-grid">
            <div class="setting-item">
              <label>
                Enable Export:
                <input type="checkbox" v-model="exportEnabled">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Enable Column Label:
                <input type="checkbox" v-model="exportColumnLabel">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Format:
                <select v-model="exportFormat">
                  <option v-for="format in availableExportFormats" :key="format" :value="format">
                    {{ format }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Paper Size:
                <select v-model="exportPaperSize">
                  <option v-for="size in availablePaperSizes" :key="size" :value="size">
                    {{ size }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Orientation:
                <select v-model="exportOrientation">
                  <option v-for="orient in availableOrientations" :key="orient" :value="orient">
                    {{ orient }}
                  </option>
                </select>
              </label>
            </div>
            <div class="setting-item">
              <label>
                Quality (0-1):
                <input type="number" v-model="exportQuality" min="0.1" max="1" step="0.05">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Scale (0.5-3):
                <input type="number" v-model="exportScale" min="0.5" max="3" step="0.1">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Margin (px):
                <input type="number" v-model="exportMargin" min="0" max="50">
              </label>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h4 @click="toggleSection('importConfig')" class="toggle-header">Import Data
            <span :class="{'arrow-down': sections.importConfig, 'arrow-up': !sections.importConfig}">▼</span>
          </h4>
          <div v-if="sections.importConfig" class="settings-grid">
            <div class="setting-item">
              <button 
                class="import-button" 
                @click="showImporter = true"
                style="width: 100%; padding: 8px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer;"
              >
                Open Importer
              </button>
            </div>
            <div class="setting-item">
              <button
                class="download-csv-button"
                @click="downloadSampleCSV"
                style="width: 100%; padding: 8px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer;"
              >
                Download Example CSV
              </button>
            </div>
            <div class="setting-item">
              <button
                class="download-csv-button"
                @click="downloadSampleJIRA"
                style="width: 100%; padding: 8px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer;"
              >
                Download Example JIRA
              </button>
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
                Show Bar Label:
                <input type="checkbox" v-model="showLabel">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Edit Bar Label:
                <input type="checkbox" v-model="barLabelEditable">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Show Progress:
                <input type="checkbox" v-model="showProgress">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Show Event Axis:
                <input type="checkbox" v-model="showEventsAxis">
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
                Event Axis Height:
                <input type="number" v-model="eventsAxisHeight">
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
                Show Pointer Marker:
                <input type="checkbox" v-model="pointerMarker">
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
            <div class="setting-item">
              <label>
                Progress resizable:
                <input type="checkbox" v-model="defaultProgressResizable">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Enable connection creation:
                <input type="checkbox" v-model="enableConnectionCreation">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Enable connection deletion:
                <input type="checkbox" v-model="enableConnectionDeletion">
              </label>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h4 @click="toggleSection('slotConfig')" class="toggle-header">Slot Customization
            <span :class="{'arrow-down': sections.slotConfig, 'arrow-up': !sections.slotConfig}">▼</span>
          </h4>
          <div v-if="sections.slotConfig" class="settings-grid">
            <div class="setting-item">
              <label>
                Custom Commands:
                <input type="checkbox" v-model="customSlots.commands">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Custom Bar Label:
                <input type="checkbox" v-model="customSlots.barLabel">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Custom Bar Tooltip:
                <input type="checkbox" v-model="customSlots.barTooltip">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Custom Current Time Label:
                <input type="checkbox" v-model="customSlots.currentTimeLabel">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Custom Pointer Marker Tooltips:
                <input type="checkbox" v-model="customSlots.pointerMarkerTooltips">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Custom Time Upper Unit:
                <input type="checkbox" v-model="customSlots.upperTimeunit">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Custom Time Lower Unit:
                <input type="checkbox" v-model="customSlots.timeunit">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Holiday Tooltip:
                <input type="checkbox" v-model="customSlots.holidayTooltip">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Event Tooltip:
                <input type="checkbox" v-model="customSlots.eventTooltip">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Timeaxis Event:
                <input type="checkbox" v-model="customSlots.timeaxisEvent">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Group Bar:
                <input type="checkbox" v-model="customSlots.groupBar">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Generic Milestone:
                <input type="checkbox" v-model="customSlots.milestone">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Specific Column Title (Label):
                <input type="checkbox" v-model="customSlots.labelColumnTitle">
              </label>
            </div>
            <div class="setting-item">
              <label>
                Specific Column (Label):
                <input type="checkbox" v-model="customSlots.labelColumnField">
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
        :pointer-marker="pointerMarker"
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
        :default-connection-relation="'SS'"
        :marker-connection="markerConnection"
        :enable-row-drag-and-drop="enableRowDragAndDrop"
        :label-resizable="labelResizable"
        :sortable="sortable"
        :default-progress-resizable="defaultProgressResizable"
        :show-progress="showProgress"
        :showLabel="showLabel"
        :barLabelEditable="barLabelEditable"
        :milestones="milestones"
        :enableConnectionCreation="enableConnectionCreation"
        :enableConnectionDeletion="enableConnectionDeletion"
        :utc="utc"
        :timeaxis-events="events"
        :showEventsAxis="showEventsAxis"
        :eventsAxisHeight="eventsAxisHeight"
        :exportEnabled="exportEnabled"
        :exportOptions="exportOptions"
        :show-importer="showImporter"
        :importer-title="'Import project data'"
        :importer-default-format="'csv'"
        :importer-allowed-formats="['jira', 'csv']"
        @click-bar="handleEvent($event, 'Bar Click')"
        @drag-bar="handleEvent($event, 'Bar Drag')"
        @sort="handleEvent($event, 'Sort Change')"
        @group-expansion="handleEvent($event, 'Group Toggle')"
        @row-drop="handleEvent($event, 'Row Drop')"
        @progress-drag-start="handleEvent($event, 'Progress Bar Start')"
        @progress-drag-end="handleEvent($event, 'Progress Bar End')"
        @connection-start="handleEvent($event, 'Connection Start')"
        @connection-complete="handleEvent($event, 'Connection Complete')"
        @connection-delete="handleEvent($event, 'Connection Deleted')"
        @label-edit="handleEvent($event, 'Bar Label Edited')"
        @export-start="handleEvent($event, 'Start Export')"
        @export-success="handleEvent($event, 'Start Success')"
        @export-error="handleEvent($event, 'Start Error')"
        @import-data="handleImport"
      >
        <g-gantt-row
          v-for="row in sampleData"
          :key="row.id"
          :id="row.id || ''"
          :label="row.label"
          :bars="row.bars || []"
          :children="row.children || []"
          :connections="row.connections || []"
          highlightOnHover
        >
          <!-- Custom Bar Label Slot -->
          <template v-if="customSlots.barLabel" #bar-label="{ bar }">
            <div class="custom-bar-label">
              <span class="bar-icon">🔷</span>
              <span class="bar-title">{{ bar.ganttBarConfig.label }}</span>
              <span class="bar-id">#{{ bar.ganttBarConfig.id }}</span>
            </div>
          </template>

          <!-- Custom group bar -->
        <template v-if="customSlots.groupBar" #group-bar="{ width, height, bar }">
          <div class="custom-group-bar" :style="{ width: width + 'px', height: height + 'px' }">
            <div class="group-header" :style="{ background: bar.ganttBarConfig.style?.background || '#35495e' }">
              {{ bar.ganttBarConfig.label }}
            </div>
            <div class="group-progress-container">
              <div 
                class="group-progress" 
                :style="{ 
                  width: (bar.ganttBarConfig.progress || 0) + '%',
                  background: bar.ganttBarConfig.style?.background ? `${bar.ganttBarConfig.style.background}aa` : '#35495eaa'
                }"
              ></div>
            </div>
          </div>
        </template>
        </g-gantt-row>

        <template #milestone-milestone2="{ milestone }">
          <div class="milestone-custom">
            <i>📍</i>
            <span>{{ milestone.name }}</span>
          </div>
        </template>

        <template v-if="customSlots.commands" #commands="{ 
          zoomIn, zoomOut, scrollRowUp, scrollRowDown,
          handleToStart, handleBack, handleForward, handleToEnd,
          expandAllGroups, collapseAllGroups,
          undo, redo, canUndo, canRedo,
          isAtTop, isAtBottom, zoomLevel 
        }">
          <div class="custom-commands" :style="customCommandStyle">
            <div class="command-group">
              <span class="command-label">Zoom</span>
              <button class="command-button" @click="zoomOut" :disabled="zoomLevel === 1">-</button>
              <span>{{ zoomLevel }}x</span>
              <button class="command-button" @click="zoomIn" :disabled="zoomLevel === 10">+</button>
            </div>
          

          
            <div class="command-group">
              <span class="command-label">Navigation</span>
              <button class="command-button" @click="handleToStart">⟪</button>
              <button class="command-button" @click="handleBack">⟨</button>
              <button class="command-button" @click="handleForward">⟩</button>
              <button class="command-button" @click="handleToEnd">⟫</button>
            </div>

            <div class="command-group">
              <span class="command-label">Rows</span>
              <button class="command-button" @click="scrollRowUp" :disabled="isAtTop">↑</button>
              <button class="command-button" @click="scrollRowDown" :disabled="isAtBottom">↓</button>
            </div>

            <div class="command-group">
              <span class="command-label">Groups</span>
              <button class="command-button" @click="expandAllGroups">Expand</button>
              <button class="command-button" @click="collapseAllGroups">Collapse</button>
            </div>

            <div class="command-group">
              <span class="command-label">History</span>
              <button class="command-button" @click="undo" :disabled="!canUndo">Undo</button>
              <button class="command-button" @click="redo" :disabled="!canRedo">Redo</button>
            </div>

        </div>
      </template>
  

        <!-- Custom Bar Tooltip Slot -->
        <template v-if="customSlots.barTooltip" #bar-tooltip="{ bar, barStart, barEnd }">
          <div class="custom-tooltip">
            <div class="tooltip-header">{{ bar!.ganttBarConfig.label }}</div>
            <div class="tooltip-content">
              <div>Start: {{ new Date(barStart).toLocaleDateString() }}</div>
              <div>End: {{ new Date(barEnd).toLocaleDateString() }}</div>
            </div>
          </div>
        </template>

        <!-- Custom Current Time Label Slot -->
        <template v-if="customSlots.currentTimeLabel" #current-time-label>
          <div class="custom-time-label">
            <span class="time-icon">⌚</span>
            <span>{{ new Date().toLocaleTimeString() }}</span>
          </div>
        </template>

        <!-- Custom Pointer Marker Tooltips Slot -->
        <template v-if="customSlots.pointerMarkerTooltips" #pointer-marker-tooltips="{ hitBars, datetime }">
          <div style="background: crimson;">
            <div>{{ datetime }}</div>
            <div>
              <ul>
                <li v-for="bar in hitBars" :key="bar.ganttBarConfig.id">
                  {{ bar.ganttBarConfig.label ?? bar.ganttBarConfig.id }}
                </li>
              </ul>
            </div>
          </div>
        </template>

        <!-- Custom Upper Time Unit Slot -->
        <template v-if="customSlots.upperTimeunit" #upper-timeunit="{ label, value, date }">
          <div class="custom-timeunit">
            <div class="timeunit-label">{{ label }}</div>
            <div class="timeunit-date">{{ new Date(date).toLocaleDateString() }}</div>
          </div>
        </template>

        <!-- Custom label column title -->
        <template v-if="customSlots.labelColumnTitle" #label-column-title-label>
          <div class="custom-column-title">
            <span class="title-icon">📊</span>
            <span class="title-text">{{ labelColumnTitle }}</span>
            <div class="column-subtitle">Project Planning</div>
          </div>
        </template>
        <!-- Custom lower time units -->
        <template v-if="customSlots.timeunit" #timeunit="{ label, date }">
          <div class="custom-timeunit-lower" :class="{ 'weekend': new Date(date).getDay() % 6 === 0 }">
            <div class="timeunit-number">{{ new Date(date).getDate() }}</div>
            <div class="timeunit-day">{{ new Date(date).toLocaleDateString(locale, { weekday: 'short' }) }}</div>
          </div>
        </template>

        <!-- Custom holiday tooltip -->
        <template v-if="customSlots.holidayTooltip" #holiday-tooltip="{ unit }">
          <div class="custom-holiday-tooltip">
            <div class="holiday-icon">🎉</div>
            <div class="holiday-name">{{ unit.holidayName }}</div>
          </div>
        </template>

        <!-- Custom event tooltip -->
        <template v-if="customSlots.eventTooltip" #event-tooltip="{ event, formatDate }">
          <div class="custom-event-tooltip">
            <div class="event-tooltip-header">{{ event.label }}</div>
            <div class="event-tooltip-dates">
              <div>Start: {{ formatDate(event.startDate) }}</div>
              <div>End: {{ formatDate(event.endDate) }}</div>
            </div>
            <div v-if="event.description" class="event-tooltip-description">
              {{ event.description }}
            </div>
          </div>
        </template>

        <!-- Custom timeaxis events -->
        <template v-if="customSlots.timeaxisEvent" #timeaxis-event="{ event }">
          <div class="custom-timeaxis-event">
            <span class="event-dot" :style="{ background: event.backgroundColor || '#42b883' }"></span>
            <span class="event-label">{{ event.label }}</span>
          </div>
        </template>

        <!-- Custom generic milestone -->
        <template v-if="customSlots.milestone" #milestone="{ milestone, styleConfig }">
          <div class="custom-milestone-generic">
            <div class="milestone-label">{{ milestone.name }}</div>
            <div class="milestone-date">{{ new Date(milestone.date).toLocaleDateString(locale, { dateStyle: 'medium' }) }}</div>
          </div>
        </template>

        <!-- Custom specific column (Label) -->
        <template v-if="customSlots.labelColumnField" #label-column-label="{ value, row }">
          <div class="custom-label-field">
            <div class="label-field-content">
              <span class="priority-indicator" 
                    :class="row.id.toString().includes('task') ? 'high-priority' : 'normal-priority'"></span>
              <span>{{ value }}</span>
            </div>
          </div>
        </template>

        <!-- Custom specific column for groups (Label) -->
        <template v-if="customSlots.labelColumnField" #label-column-label-group="{ value, row }">
          <div class="custom-group-field">
            <span class="group-indicator">📦</span>
            <span class="group-label">{{ value }}</span>
          </div>
        </template>
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

.custom-commands {
  display: flex;
  gap: 10px;
  padding: 8px;
}

.command-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.command-button {
  padding: 2px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  font-size: 10px;
}

.command-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.command-label {
  font-size: 0.8em;
  color: #fff;
  font-weight: 600;
}

.custom-bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  width: 100%;
}

.bar-icon {
  font-size: 12px;
}

.bar-title {
  flex: 1;
  font-weight: 500;
}

.bar-id {
  font-size: 10px;
  opacity: 0.7;
}

.custom-tooltip {
  background: rgba(0, 0, 0, 0.9);
  padding: 8px;
  border-radius: 4px;
  min-width: 200px;
}

.tooltip-header {
  color: #42b883;
  font-weight: 500;
  margin-bottom: 4px;
}

.tooltip-content {
  font-size: 12px;
  color: white;
}

.custom-time-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #42b883;
}

.custom-timeunit {
  text-align: center;
  font-size: 12px;
}

.timeunit-label {
  font-weight: 500;
}

.timeunit-date {
  font-size: 10px;
  opacity: 0.7;
}

.milestone-custom {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 1em;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    position: absolute;
    top: 4px;
    transform: translateY(0);
    background-color: #35496E;
    color: #42B883;
    font-weight: 700;
}

.custom-column-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
}

.title-icon {
  font-size: 16px;
  margin-bottom: 4px;
}

.title-text {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 12px;
}

.column-subtitle {
  font-size: 10px;
  opacity: 0.7;
}

.custom-row-label {
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.row-label-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.row-icon {
  font-size: 12px;
}

.row-label-meta {
  font-size: 10px;
  opacity: 0.7;
}

.custom-timeunit-lower {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: center;
}

.custom-timeunit-lower.weekend {
  background-color: rgba(255, 0, 0, 0.1);
}

.timeunit-number {
  font-weight: bold;
  font-size: 14px;
}

.timeunit-day {
  font-size: 10px;
  opacity: 0.8;
}

.custom-event-tooltip {
  background: #2a2f42;
  padding: 8px 12px;
  border-radius: 4px;
  min-width: 200px;
  color: white;
}

.holiday-name,
.event-tooltip-header {
  font-weight: bold;
  margin-bottom: 2px;
  color: #42b883;
}

.holiday-type,
.holiday-date,
.event-tooltip-dates,
.event-tooltip-description {
  font-size: 11px;
  opacity: 0.9;
}

.custom-timeaxis-event {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 4px;
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.event-label {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-milestone-generic {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 0;
}

.milestone-diamond {
  width: 16px;
  height: 16px;
  margin-bottom: 2px;
}

.milestone-label {
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
}

.milestone-date {
  font-size: 8px;
  opacity: 0.7;
  white-space: nowrap;
}

.custom-group-bar {
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.group-header {
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  color: white;
  font-weight: bold;
  font-size: 11px;
}

.group-progress-container {
  height: 40%;
  background: rgba(255, 255, 255, 0.2);
}

.group-progress {
  height: 100%;
  transition: width 0.3s ease;
}

.custom-label-field,
.custom-group-field {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
}

.label-field-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.high-priority {
  background: #e74c3c;
}

.normal-priority {
  background: #f1c40f;
}

.group-indicator {
  margin-right: 6px;
}

.group-label {
  font-weight: bold;
}

@media (max-width: 1200px) {
  .settings-container {
    grid-template-columns: 1fr;
  }
}
</style>
        