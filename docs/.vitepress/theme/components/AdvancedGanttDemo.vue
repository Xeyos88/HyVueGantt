<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'

const isLibraryReady = ref(false)
const currentScheme = ref('default')

const rows = ref([
  {
    label: 'Marketing',
    bars: [
      {
        ganttBarConfig: {
          id: 'marketing1',
          label: 'Campaign Planning',
          hasHandles: true,
          style: {
            background: 'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
        },
        progress: 75,
        start: '2024-12-11',
        end: '2024-12-15',
      },
    ],
  },
  {
    label: 'Development',
    bars: [
      {
        ganttBarConfig: {
          id: 'dev1',
          label: 'Sprint 1',
          hasHandles: true,
          style: {
            background: 'linear-gradient(45deg, #4ECDC4, #2EAF7D)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
        },
        progress: 90,
        start: '2024-12-12',
        end: '2024-12-16',
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
      <div class="custom-header">
           Theme:
          <select v-model="currentScheme">
              <option value="default">Default</option>
              <option value="vue">Vue</option>
              <option value="dark">Dark</option>
              <option value="creamy">Creamy</option>
          </select>
        </div>
      <g-gantt-chart
        chart-start="2024-12-11"
        chart-end="2024-12-17"
        precision="day"
        bar-start="start"
        bar-end="end"
        :push-on-overlap="true"
        :no-overlap="true"
        grid
        :color-scheme="currentScheme"
        label-column-title="Projects"
      >


        <g-gantt-row
          v-for="row in rows"
          :key="row.label"
          :label="row.label"
          :bars="row.bars"
          :highlight-on-hover="true"
        >
          <template #bar-label="{ bar }">
            <div class="custom-bar-label">
              <span>{{ bar.ganttBarConfig.label }}</span>
              <span class="progress">{{ bar.progress }}%</span>
            </div>
          </template>
        </g-gantt-row>
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

.custom-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  margin-bottom: 12px;
}

.custom-header select {
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #eaeaea;
}

.custom-bar-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 8px;
}

.progress {
  font-size: 0.8em;
  opacity: 0.8;
}
</style>