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
- `precision`: Sets the finest time unit ('hour', 'day', 'week', 'month'); zooming out can switch to coarser units unless `fixed-precision` is set
- `fixed-precision`: When `true`, the time unit never changes while zooming
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

### Zoom Bounds

The zoom controls in the commands bar are constrained by `min-zoom` and `max-zoom`.
Both default to the previous fixed behaviour (`max-zoom: 10`, `min-zoom: 1`) and are
clamped to the hard range `[1, 20]` (with `min-zoom` additionally clamped to `max-zoom`)
to keep the time axis readable and performant. `default-zoom` is clamped into the
resulting `[min-zoom, max-zoom]` range.

```typescript
<g-gantt-chart
  :default-zoom="6"
  :min-zoom="2"
  :max-zoom="20"
/>
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
4. Use `maxRows` with `virtualRows` to limit the number of mounted rows

## Row virtualization

Enable `virtual-rows` together with a positive `max-rows` to mount only the visible
rows plus a small buffer. Labels and timeline rows share the same window.

```vue
<g-gantt-chart
  chart-start="2026-01-01 00:00"
  chart-end="2026-02-01 00:00"
  bar-start="start"
  bar-end="end"
  :initial-rows="rows"
  :row-height="40"
  :max-rows="10"
  :virtual-rows="true"
  :virtual-rows-overscan="5"
/>
```

`virtualRows` defaults to `false`. `virtualRowsOverscan` defaults to 5 extra rows
on each side. With 1,000 rows and a ten-row viewport, this mounts about 15–21
rows instead of 1,000. `maxRows` alone only limits the viewport height; with
`maxRows: 0`, virtualization is inactive. Keep row heights fixed using `rowHeight`;
custom CSS must not change individual row heights or add vertical margins.

Expanded groups are flattened for rendering; their labels, nesting, synthetic
bars and inherited row slots are retained. Sorting and data changes update the
window and clamp the scroll position when the dataset shrinks. Connections use
date/row coordinates, so connections to rows outside the window remain visible
where they cross the viewport.

For compatibility with DOM-based dragging, resizing and editing, all expanded
rows are temporarily mounted during a row interaction. The window is restored
on release (or when a label editor loses focus). Graphic exports also temporarily
mount all expanded rows, remove the viewport height limit, and restore scrolling
after completion or failure. Excel exports continue to read the complete dataset.
This reduces DOM work during normal viewing and scrolling; it does not reduce
data storage, calculation costs, or peak DOM size during interactions and exports.
Time-axis columns are not virtualized.
