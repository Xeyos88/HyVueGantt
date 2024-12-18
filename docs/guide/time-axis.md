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
  :highlight-today="true"
  :highlight-weekends="true"
  :custom-timeaxis-format="customFormat"
/>

const customFormat = (date: Date, precision: TimeUnit) => {
  // Your custom formatting logic
  return formattedDate;
};
```

## Working with Time Zones

The time axis respects the local time zone by default. For specific time zone handling:

```typescript
// Using day.js for time zone support
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
```