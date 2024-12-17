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