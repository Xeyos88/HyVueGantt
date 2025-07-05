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
| children | `ChartRow[]` | `[]` | Array of child rows |


### Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| drop | `{ e: MouseEvent, datetime: string \| Date }` | Item dropped on row |
| range-selection | `{ row: ChartRow, startDate: string | Date, endDate: string | Date, e: MouseEvent }` | User selects a time range by dragging across the row |

### Slots

| Slot Name | Props | Description |
|-----------|-------|-------------|
| label | None | Custom row label content |
| bar-label | `{ bar: GanttBarObject }` | Custom bar label content |
| group-bar | `{ width: number, height: number, bar: GanttBarObject }` | Custom group bar visualization |
| range-selection-tooltip | `{ startDate, endDate, formattedStartDate, formattedEndDate, tick, tickEnabled, tickUnit, internalPrecision }` | Custom tooltip for range selection |

### Bar Configuration (ganttBarConfig)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| id | `string` | Required | Unique identifier for the bar |
| label | `string` | `undefined` | Label displayed on the bar |
| html | `string` | `undefined` | Custom HTML content for the bar |
| hasHandles | `boolean` | `false` | Shows resize handles on the bar |
| immobile | `boolean` | `false` | When true, bar cannot be moved |
| bundle | `string` | `undefined` | Identifier to group multiple bars |
| pushOnOverlap | `boolean` | `undefined` | If true, pushes other bars when overlapping |
| pushOnConnect | `boolean` | `undefined` | If true, pushes connected bars when moving |
| dragLimitLeft | `number` | `undefined` | Left limit for dragging |
| dragLimitRight | `number` | `undefined` | Right limit for dragging |
| style | `CSSProperties` | `undefined` | Custom CSS styles for the bar |
| class | `string` | `undefined` | Custom CSS classes for the bar |
| connections | `GanttBarConnection[]` | `undefined` | Array of connections to other bars |
| milestoneId | `string` | `undefined` | Identifier of milestone associated with the bar |

### Bar Connection Configuration

The `connections` property in `ganttBarConfig` accepts an array of `GanttBarConnection` objects. Each connection has the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| targetId | `string` | Required | ID of the target bar to connect to |
| type | `'bezier' \| 'straight' \| 'squared'` | `'straight'` | Visual style of the connection line |
| color | `string` | `'#ff0000'` | Color of the connection line |
| pattern | `'solid' \| 'dot' \| 'dash' \| 'dashdot'` | `'solid'` | Line pattern style |
| animated | `boolean` | `false` | Whether the connection should be animated |
| animationSpeed | `'slow' \| 'normal' \| 'fast'` | `'normal'` | Speed of the connection animation |
| relation | `'SF' \| 'SS' \| 'FS'` | `'FF'` | Define the points of connection between bars. S=START, F=FINISH |
| label | `string` | `undefined` | Text label displayed on the connection |
| labelAlwaysVisible | `boolean` | `false` | Whether the label should always be visible or only when selected |
| labelStyle | `ConnectionLabelStyle` | `undefined` | Styling options for the connection label |

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
    bundle?: string
    pushOnOverlap?: boolean
    pushOnConnect?: boolean
    dragLimitLeft?: number
    dragLimitRight?: number
    style?: CSSProperties;
    class?: string;
    connections?: GanttBarConnection[];
    milestoneName?: string
  }
}
```

### Example with Custom Bar Configuration

```vue
<script setup lang="ts">
const bars = [
  {
    start: '2024-01-01',
    end: '2024-01-15',
    ganttBarConfig: {
      id: '1',
      label: 'Design Phase',
      hasHandles: true,
      style: {
        background: '#42b883',
        borderRadius: '4px'
      },
      connections: [
        {
          targetId: '2',
          type: 'bezier',
          color: '#e74c3c',
          relation: 'FS',
          label: 'Critical Dependency',
          labelAlwaysVisible: true,
          labelStyle: labelStyle
        }
      ]
    }
  },
  {
    start: '2024-01-16',
    end: '2024-02-15',
    ganttBarConfig: {
      id: '2',
      label: 'Development Phase',
      style: {
        background: '#35495e'
      },
      connections: [
        {
          targetId: '3',
          type: 'straight',
          pattern: 'dash',
          label: 'Review Required',
          labelAlwaysVisible: false,
          labelStyle: {
            color: '#f39c12',
            fontSize: '10px',
            fontWeight: '500'
          }
        }
      ]
    }
  },
  {
    start: '2024-02-16',
    end: '2024-03-01',
    ganttBarConfig: {
      id: '3',
      label: 'Testing Phase',
      style: {
        background: '#ff7e67'
      }
    }
  }
]
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