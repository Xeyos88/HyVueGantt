# Chart Configuration

The Chart Configuration module provides comprehensive control over your Gantt chart's behavior and appearance. This guide explains the essential configuration options and how to use them effectively.

## Basic Configuration

The GGanttChart component accepts several key configuration properties that define its core functionality:

```typescript
<g-gantt-chart
  :chart-start="'2024-01-01'"
  :chart-end="'2024-12-31'"
  :precision="'day'"
  :bar-start="'start'"
  :bar-end="'end'"
  :row-height="40"
  :color-scheme="'default'"
  :grid="true"
  :push-on-overlap="true"
  :no-overlap="false"
  :commands="true"
  :auto-scroll-to-today="true"
/>
```

### Essential Properties

- `chart-start` and `chart-end`: Define the visible time range (string | Date)
- `precision`: Sets the time unit ('hour', 'day', 'week', 'month')
- `bar-start` and `bar-end`: Specify data properties for dates
- `row-height`: Controls row height in pixels

### Advanced Configuration

```typescript
interface GGanttChartConfig {
  enableMinutes?: boolean;
  enableConnections?: boolean;
  defaultConnectionType?: ConnectionType;
  maxRows?: number;
  labelColumnTitle?: string;
  labelColumnWidth?: string;
  font?: string;
  dateFormat?: string;
}
```

## Event Handling

The chart emits various events that you can listen to:

```typescript
<g-gantt-chart
  @click-bar="handleClick"
  @drag-bar="handleDrag"
  @dragend-bar="handleDragEnd"
  @mouseenter-bar="handleMouseEnter"
  @mouseleave-bar="handleMouseLeave"
  @sort="handleSort"
/>
```

## Auto-Scroll to Current Date

The chart can automatically center on today's date when it loads using the `autoScrollToToday` property:

```vue
<template>
  <g-gantt-chart
    :chart-start="'2024-01-01'"
    :chart-end="'2024-12-31'"
    :auto-scroll-to-today="true"
  >
    <!-- Your gantt rows here -->
  </g-gantt-chart>
</template>
```

**Key Features:**
- Only activates when today's date falls within the chart's visible range (`chartStart` to `chartEnd`)
- Centers the current date in the viewport on chart initialization
- No action taken if today is outside the date range
- Executes after the chart is fully loaded and positioned

**Use Cases:**
- Project timelines where you want immediate visibility of current status
- Long-term planning charts that span multiple months or years
- Real-time dashboards showing current progress

## Planned Bars

The chart can display planned/expected dates alongside actual dates using the planned bars feature. This is particularly useful for project management and progress tracking scenarios.

```vue
<template>
  <g-gantt-chart
    :chart-start="'2024-01-01'"
    :chart-end="'2024-12-31'"
    :show-planned-bars="true"
  >
    <g-gantt-row
      label="Task with Planning"
      :bars="barsWithPlanning"
    />
  </g-gantt-chart>
</template>

<script setup lang="ts">
const barsWithPlanning = ref([
  {
    start: '2024-02-15',           // Actual start date
    end: '2024-02-28',             // Actual end date
    start_planned: '2024-02-01',   // Originally planned start
    end_planned: '2024-02-20',     // Originally planned end
    ganttBarConfig: {
      id: 'task-1',
      label: 'Development Task',
      // Custom styling for the planned bar
      plannedStyle: {
        backgroundColor: '#e3f2fd',
        border: '1px dashed #1976d2',
        opacity: 0.7
      }
    }
  }
])
</script>
```

### Planned Bars Features

- **Visual Comparison**: Shows both planned and actual timelines for easy variance tracking
- **Custom Styling**: Use `plannedStyle` in `ganttBarConfig` to customize planned bar appearance
- **Tooltip Integration**: Tooltips automatically display both actual and planned dates when enabled
- **Export Support**: Planned dates are included in Excel/CSV exports with dedicated columns
- **Independent Positioning**: Planned bars are positioned independently of actual bars

### Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| showPlannedBars | `boolean` | `false` | Enable/disable planned bars visualization |
| start_planned | `string \| Date` | - | Planned start date for the bar |
| end_planned | `string \| Date` | - | Planned end date for the bar |
| plannedStyle | `GanttCSSProperties` | `{}` | Custom CSS styling for planned bars |

**Key Benefits:**
- **Project Variance Tracking**: Compare planned vs actual timelines
- **Schedule Analysis**: Identify delays and schedule deviations
- **Resource Planning**: Visualize original planning alongside current reality
- **Client Communication**: Show progress against original estimates

## Performance Optimization

For optimal performance:

1. Use appropriate precision for your needs
2. Limit the visible time range
3. Consider pagination for large datasets
4. Use maxRows for controlled loading