# Time Axis

The Time Axis is a crucial component that provides temporal navigation and visualization in your Gantt chart. This guide explains how to configure and customize the time axis effectively.

## Time Units and Precision

The time axis supports multiple precision levels:

```typescript
type TimeUnit = 'hour' | 'day' | 'date' | 'week' | 'month';

<g-gantt-chart
  :precision="'day'"
  :enable-minutes="false"
  :date-format="'YYYY-MM-DD HH:mm'"
/>
```

### Format Patterns

Common date format patterns:

```typescript
const formats = {
  hour: 'HH:mm',
  day: 'DD MMM',
  week: 'WW',
  month: 'MMMM YYYY'
};
```

## Time Scale Customization

You can customize the time scale appearance:

```typescript
<g-gantt-chart
  :day-option-label="['day', 'name', 'doy']"
  :highlighted-hours="[9, 10, 11, 12, 13, 14, 15, 16, 17]"
  :highlighted-days-in-week="[0, 6]"  
  :highlighted-days-in-month="[1, 15, 30]"
  :highlighted-months="[0, 6]"  
  :holiday-highlight="'US'"
  :locale="'en'"
/>
```

## Events Axis

The Gantt chart supports a third axis specifically for displaying timeline events such as releases, milestones, or any time-bound occurrences. This events axis appears below the regular time units and provides visual cues for important dates or periods.

### Configuring Events

Events are defined using the `timeaxisEvents` property, which accepts an array of `TimeaxisEvent` objects:

```typescript
const events = [
  {
    id: '1',
    label: 'Release v1.0',
    startDate: '2024-01-15',
    endDate: '2024-01-15',
    backgroundColor: '#42b883',
    color: '#ffffff',
    description: 'Product release v1.0'
  },
  {
    id: '2',
    label: 'Maintenance',
    startDate: '2024-02-10',
    endDate: '2024-02-12',
    backgroundColor: '#e67e22',
    description: 'Scheduled maintenance'
  }
]