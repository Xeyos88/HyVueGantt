# Types Reference

HyVue Gantt exposes several TypeScript types and interfaces for use in your application. Here are the main types you'll work with:

## Core Types

```typescript
// Time Units
type TimeUnit = 'hour' | 'day' | 'week' | 'month';
type DayOptionLabel = "day" | "doy" | "name" | "number"

// Connection Types
type ConnectionType = 'bezier' | 'straight' | 'squared';
type ConnectionPattern = 'solid' | 'dot' | 'dash' | 'dashdot';
type ConnectionSpeed = 'slow' | 'normal' | 'fast';
```

## Bar Configuration

```typescript
interface GanttBarConfig {
  id: string;
  label?: string;
  html?: string;
  hasHandles?: boolean;
  immobile?: boolean;
  bundle?: string;
  pushOnOverlap?: boolean;
  pushOnConnect?: boolean;
  dragLimitLeft?: number
  dragLimitRight?: number
  style?: CSSProperties;
  class?: string;
  connections?: GanttBarConnection[];
  milestoneId?: string
}

interface GanttBarObject {
  [key: string]: any;
  ganttBarConfig: GanttBarConfig;
}
```

## Chart Data Types

```typescript
interface ChartRow {
  id?: string | number
  label: string
  bars: GanttBarObject[]
  children?: ChartRow[]
  _originalNode?: any
}

interface BarConnection {
  sourceId: string;
  targetId: string;
  type?: ConnectionType;
  color?: string;
  pattern?: ConnectionPattern;
  animated?: boolean;
  animationSpeed?: ConnectionSpeed;
}

interface GanttMilestone {
  id: string
  date: string
  name: string
  description?: string
  color?: string
}
```
## Label Data Types

```typescript
type LabelColumnField = "Id" | "Label" | "StartDate" | "EndDate" | "Duration"

type SortFunction = (a: ChartRow, b: ChartRow) => number
type SortDirection = "asc" | "desc" | "none"

interface LabelColumnConfig {
  field: LabelColumnField | string
  sortable?: boolean
  valueGetter?: (row: ChartRow) => string | number
  sortFn?: SortFunction
}
```