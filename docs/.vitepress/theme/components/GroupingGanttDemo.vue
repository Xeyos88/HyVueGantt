<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import type { ColorScheme, LabelColumnConfig } from 'hy-vue-gantt'

const isLibraryReady = ref(false)

const customColorScheme: ColorScheme = {
  primary: '#2C3E50',
  secondary: '#34495E',
  ternary: '#3498DB',
  quartenary: '#2980B9',
  hoverHighlight: 'rgba(52, 152, 219, 0.2)',
  markerCurrentTime: '#9B59B6',
  text: '#ECF0F1',
  background: '#1A1A1A',
  commands: '#2C3E50',
  rangeHighlight: '#42b883',
  holidayHighlight: 'rgba(142, 68, 173, 0.3)',
  barContainer: '#42FC83',
  rowContainer: '#1A1A1A',
  gridAndBorder: '#eaeaea'
}

const rows = ref([
  {
    id: 'frontend',
    label: 'Frontend Development',
    children: [
      {
        id: 'fe-core',
        label: 'Core Features',
        children: [
          {
            id: 'fe-setup',
            label: 'Project Setup',
            bars: [{
              start: '2024-01-15 09:00',
              end: '2024-01-15 17:00',
              ganttBarConfig: {
                id: 'fe-1',
                label: 'Initial Setup',
                style: { background: '#3498DB' },
                connections: [{ targetId: 'fe-2', type: 'bezier', animated: true, color: '#3498DB' }]
              }
            }]
          },
          {
            id: 'fe-arch',
            label: 'Architecture',
            bars: [{
              start: '2024-01-15 13:00',
              end: '2024-01-16 12:00',
              ganttBarConfig: {
                id: 'fe-2',
                label: 'Core Architecture',
                style: { background: '#2980B9' },
                connections: [{ targetId: 'fe-3', type: 'straight', pattern: 'dash', color: '#2980B9' }]
              }
            }]
          },
          {
            id: 'fe-deps',
            label: 'Dependencies Setup',
            bars: [{
              start: '2024-01-16 09:00',
              end: '2024-01-16 17:00',
              ganttBarConfig: {
                id: 'fe-3',
                label: 'Package Installation',
                style: { background: '#9B59B6' },
                connections: [{ targetId: 'fe-4', type: 'squared', animated: true, color: '#9B59B6' }]
              }
            }]
          }
        ]
      },
      {
        id: 'fe-ui',
        label: 'UI Components',
        children: [
          {
            id: 'fe-comp-base',
            label: 'Base Components',
            bars: [{
              start: '2024-01-16 13:00',
              end: '2024-01-17 17:00',
              ganttBarConfig: {
                id: 'fe-4',
                label: 'Button Components',
                style: { background: '#8E44AD' },
                connections: [{ targetId: 'fe-5', type: 'bezier', pattern: 'dash', color: '#8E44AD' }]
              }
            }]
          },
          {
            id: 'fe-comp-form',
            label: 'Form Components',
            bars: [{
              start: '2024-01-17 09:00',
              end: '2024-01-18 17:00',
              ganttBarConfig: {
                id: 'fe-5',
                label: 'Input Components',
                style: { background: '#2C3E50' }
              }
            }]
          },
          {
            id: 'fe-comp-layout',
            label: 'Layout Components',
            bars: [{
              start: '2024-01-17 13:00',
              end: '2024-01-19 12:00',
              ganttBarConfig: {
                id: 'fe-6',
                label: 'Grid System',
                style: { background: '#34495E' }
              }
            }]
          }
        ]
      },
      {
        id: 'fe-state',
        label: 'State Management',
        children: [
          {
            id: 'fe-store-setup',
            label: 'Store Setup',
            bars: [{
              start: '2024-01-18 09:00',
              end: '2024-01-19 17:00',
              ganttBarConfig: {
                id: 'fe-7',
                label: 'Store Configuration',
                style: { background: '#16A085' }
              }
            }]
          },
          {
            id: 'fe-store-modules',
            label: 'Store Modules',
            bars: [{
              start: '2024-01-19 09:00',
              end: '2024-01-20 17:00',
              ganttBarConfig: {
                id: 'fe-8',
                label: 'Auth Module',
                style: { background: '#1ABC9C' }
              }
            }]
          }
        ]
      }
    ]
  },
  {
    id: 'backend',
    label: 'Backend Development',
    children: [
      {
        id: 'be-core',
        label: 'Core Services',
        children: [
          {
            id: 'be-setup',
            label: 'Initial Setup',
            bars: [{
              start: '2024-01-15 10:00',
              end: '2024-01-16 12:00',
              ganttBarConfig: {
                id: 'be-1',
                label: 'Project Structure',
                style: { background: '#27AE60' },
                connections: [{ targetId: 'be-2', type: 'squared', animated: true, color: '#27AE60' }]
              }
            }]
          },
          {
            id: 'be-auth',
            label: 'Authentication',
            bars: [{
              start: '2024-01-16 13:00',
              end: '2024-01-17 17:00',
              ganttBarConfig: {
                id: 'be-2',
                label: 'Auth Service',
                style: { background: '#2ECC71' },
                connections: [{ targetId: 'be-3', type: 'bezier', pattern: 'dash', color: '#2ECC71' }]
              }
            }]
          },
          {
            id: 'be-db',
            label: 'Database Setup',
            bars: [{
              start: '2024-01-17 09:00',
              end: '2024-01-18 17:00',
              ganttBarConfig: {
                id: 'be-3',
                label: 'Database Configuration',
                style: { background: '#F1C40F' }
              }
            }]
          }
        ]
      },
      {
        id: 'be-api',
        label: 'API Development',
        children: [
          {
            id: 'be-api-users',
            label: 'Users API',
            bars: [{
              start: '2024-01-18 09:00',
              end: '2024-01-19 17:00',
              ganttBarConfig: {
                id: 'be-4',
                label: 'Users CRUD',
                style: { background: '#F39C12' }
              }
            }]
          },
          {
            id: 'be-api-products',
            label: 'Products API',
            bars: [{
              start: '2024-01-19 09:00',
              end: '2024-01-20 17:00',
              ganttBarConfig: {
                id: 'be-5',
                label: 'Products CRUD',
                style: { background: '#E67E22' }
              }
            }]
          }
        ]
      }
    ]
  },
  {
    id: 'mobile',
    label: 'Mobile Development',
    children: [
      {
        id: 'mob-ios',
        label: 'iOS App',
        children: [
          {
            id: 'ios-setup',
            label: 'Project Setup',
            bars: [{
              start: '2024-01-17 09:00',
              end: '2024-01-18 17:00',
              ganttBarConfig: {
                id: 'ios-1',
                label: 'iOS Setup',
                style: { background: '#E74C3C' },
                connections: [{ targetId: 'ios-2', type: 'straight', animated: true, color: '#E74C3C' }]
              }
            }]
          },
          {
            id: 'ios-core',
            label: 'Core Features',
            bars: [{
              start: '2024-01-18 09:00',
              end: '2024-01-19 17:00',
              ganttBarConfig: {
                id: 'ios-2',
                label: 'Core Implementation',
                style: { background: '#C0392B' }
              }
            }]
          },
          {
            id: 'ios-ui',
            label: 'UI Implementation',
            bars: [{
              start: '2024-01-19 09:00',
              end: '2024-01-20 17:00',
              ganttBarConfig: {
                id: 'ios-3',
                label: 'UI Components',
                style: { background: '#D35400' }
              }
            }]
          }
        ]
      },
      {
        id: 'mob-android',
        label: 'Android App',
        children: [
          {
            id: 'android-setup',
            label: 'Project Setup',
            bars: [{
              start: '2024-01-17 09:00',
              end: '2024-01-18 17:00',
              ganttBarConfig: {
                id: 'android-1',
                label: 'Android Setup',
                style: { background: '#8E44AD' },
                connections: [{ targetId: 'android-2', type: 'bezier', animated: true, color: '#8E44AD' }]
              }
            }]
          },
          {
            id: 'android-core',
            label: 'Core Features',
            bars: [{
              start: '2024-01-18 09:00',
              end: '2024-01-19 17:00',
              ganttBarConfig: {
                id: 'android-2',
                label: 'Core Implementation',
                style: { background: '#9B59B6' }
              }
            }]
          },
          {
            id: 'android-ui',
            label: 'UI Implementation',
            bars: [{
              start: '2024-01-19 09:00',
              end: '2024-01-20 17:00',
              ganttBarConfig: {
                id: 'android-3',
                label: 'UI Components',
                style: { background: '#8E44AD' }
              }
            }]
          }
        ]
      }
    ]
  },
  {
    id: 'qa',
    label: 'Quality Assurance',
    children: [
      {
        id: 'qa-auto',
        label: 'Automation',
        children: [
          {
            id: 'qa-framework',
            label: 'Test Framework',
            bars: [{
              start: '2024-01-18 09:00',
              end: '2024-01-19 17:00',
              ganttBarConfig: {
                id: 'qa-1',
                label: 'Framework Setup',
                style: { background: '#F1C40F' },
                connections: [{ targetId: 'qa-2', type: 'squared', pattern: 'dash', color: '#F1C40F' }]
              }
            }]
          },
          {
            id: 'qa-e2e',
            label: 'E2E Tests',
            bars: [{
              start: '2024-01-19 09:00',
              end: '2024-01-20 17:00',
              ganttBarConfig: {
                id: 'qa-2',
                label: 'E2E Implementation',
                style: { background: '#F39C12' }
              }
            }]
          }
        ]
      },
      {
        id: 'qa-manual',
        label: 'Manual Testing',
        children: [
          {
            id: 'qa-test-cases',
            label: 'Test Cases',
            bars: [{
              start: '2024-01-18 13:00',
              end: '2024-01-19 17:00',
              ganttBarConfig: {
                id: 'qa-3',
                label: 'Test Cases Writing',
                style: { background: '#E67E22' }
              }
            }]
          },
          {
            id: 'qa-execution',
            label: 'Test Execution',
            bars: [{
              start: '2024-01-19 09:00',
              end: '2024-01-20 17:00',
              ganttBarConfig: {
                id: 'qa-4',
                label: 'Manual Testing',
                style: { background: '#D35400' }
              }
            }]
          }
        ]
      }
    ]
  },
  {
    id: 'devops',
    label: 'DevOps',
    children: [
      {
        id: 'devops-ci',
        label: 'CI/CD',
        children: [
          {
            id: 'ci-setup',
            label: 'Pipeline Setup',
            bars: [{
              start: '2024-01-15 09:00',
              end: '2024-01-16 17:00',
              ganttBarConfig: {
                id: 'devops-1',
                label: 'CI Setup',
                style: { background: '#27AE60' },
                connections: [{ targetId: 'devops-2', type: 'straight', animated: true, color: '#27AE60' }]
              }
            }]
          },
          {
            id: 'cd-setup',
            label: 'Deployment Setup',
            bars: [{
              start: '2024-01-16 09:00',
              end: '2024-01-17 17:00',
              ganttBarConfig: {
                id: 'devops-2',
                label: 'CD Setup',
                style: { background: '#2ECC71' }
              }
            }]
          }
        ]
      },
      {
        id: 'devops-monitoring',
        label: 'Monitoring',
        children: [
          {
            id: 'monitoring-setup',
            label: 'Monitoring Setup',
            bars: [{
              start: '2024-01-17 09:00',
              end: '2024-01-18 17:00',
              ganttBarConfig: {
                id: 'devops-3',
                label: 'Monitoring Configuration',
                style: { background: '#16A085' },
                connections: [{ targetId: 'devops-4', type: 'bezier', pattern: 'dash', color: '#16A085' }]
              }
            }]
          },
          {
            id: 'alerts-setup',
            label: 'Alerts Setup',
            bars: [{
              start: '2024-01-18 09:00',
              end: '2024-01-19 17:00',
              ganttBarConfig: {
                id: 'devops-4',
                label: 'Alerts Configuration',
                style: { background: '#1ABC9C' }
              }
            }]
          }
        ]
      },
      {
        id: 'devops-security',
        label: 'Security',
        children: [
          {
            id: 'security-audit',
            label: 'Security Audit',
            bars: [{
              start: '2024-01-19 09:00',
              end: '2024-01-20 17:00',
              ganttBarConfig: {
                id: 'devops-5',
                label: 'Security Review',
                style: { background: '#27AE60' }
              }
            }]
          }
        ]
      }
    ]
  }
])

const multiColumnLabel = ref<LabelColumnConfig[]>([
  {
    field: 'Label',
  },
  {
    field: 'StartDate',
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
        chart-start="2024-01-15 08:00"
        chart-end="2024-01-20 18:00"
        precision="hour"
        bar-start="start"
        bar-end="end"
        :enable-connections="true"
        :push-on-connect="true"
        grid
        :color-scheme="customColorScheme"
        label-column-title="Project Structure"
        :multi-column-label="multiColumnLabel"
      >
        <g-gantt-row
          v-for="row in rows"
          :key="row.id"
          :id="row.id"
          :label="row.label"
          :bars="row.bars || []"
          :children="row.children"
          highlightOnHover
        />
      </g-gantt-chart>
    </div>
  </ClientOnly>
</template>

<style scoped>
.demo-container {
  border: 1px solid #2C3E50;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background-color: #1A1A1A;
}
</style>