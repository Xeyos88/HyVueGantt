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

## Performance Optimization

For optimal performance:

1. Use appropriate precision for your needs
2. Limit the visible time range
3. Consider pagination for large datasets
4. Use maxRows for controlled loading