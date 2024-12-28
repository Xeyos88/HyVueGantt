# GGanttRow Component

The GGanttRow component represents a single row in the Gantt chart. It manages the display and interaction of task bars within its scope.

## Basic Usage

```vue
<template>
  <g-gantt-row
    label="Development Tasks"
    :bars="bars"
    :highlight-on-hover="true"
  />
</template>
```

## Component API

### Props

| Prop Name | Type | Default | Description |
|-----------|------|---------|-------------|
| label | `string` | Required | Row label |
| bars | `GanttBarObject[]` | Required | Array of bar objects |
| highlightOnHover | `boolean` | `false` | Highlight row on hover |
| id | `string \| number` | `` |Row identifier |


### Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| drop | `{ e: MouseEvent, datetime: string \| Date }` | Item dropped on row |

### Slots

| Slot Name | Props | Description |
|-----------|-------|-------------|
| label | None | Custom row label content |
| bar-label | `{ bar: GanttBarObject }` | Custom bar label content |

# Keyboard Controls

Bars within the row support the following keyboard controls:

| Key | Action | With Shift |
|-----|--------|------------|
| Left Arrow | Move bar backward | Move 12 units |
| Right Arrow | Move bar forward | Move 12 units |
| Up Arrow | Expand bar | Expand 12 units |
| Down Arrow | Shrink bar | Shrink 12 units |

The actual unit size depends on the chart's precision setting (hours, days, etc.).
The step increment or shift is greater if Shift is held down 

## Bar Configuration

Each bar in the bars array should follow this structure:

```typescript
interface GanttBarObject {
  [key: string]: any;
  ganttBarConfig: {
    id: string;
    label?: string;
    html?: string;
    hasHandles?: boolean;
    immobile?: boolean;
    style?: CSSProperties;
    class?: string;
    connections?: GanttBarConnection[];
  }
}
```

### Example with Custom Bar Configuration

```vue
<script setup lang="ts">
const bars = [{
  start: '2024-01-01',
  end: '2024-01-15',
  ganttBarConfig: {
    id: '1',
    label: 'Task 1',
    hasHandles: true,
    style: {
      background: '#42b883',
      borderRadius: '4px'
    },
    connections: [{
      targetId: '2',
      type: 'straight'
    }]
  }
}]
</script>

<template>
  <g-gantt-row
    label="Project Phase"
    :bars="bars"
  >
    <template #bar-label="{ bar }">
      <div class="custom-label">
        {{ bar.ganttBarConfig.label }}
      </div>
    </template>
  </g-gantt-row>
</template>
```

## Best Practices

1. Use unique IDs for each bar
2. Keep bar data immutable
3. Implement error boundaries for bar rendering
4. Handle edge cases for date ranges
5. Consider performance with large datasets

Each component documentation includes a comprehensive API reference, practical examples, and best practices for implementation. The content maintains a professional tone while being accessible to developers of all skill levels.