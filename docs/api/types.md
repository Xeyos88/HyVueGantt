# Types Reference

HyVue Gantt exposes several TypeScript types and interfaces for use in your application. Here are the main types you'll work with:

## Core Types

```typescript
// Time Units
type TimeUnit = 'hour' | 'day' | 'week' | 'month';

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
  style?: CSSProperties;
  class?: string;
  connections?: GanttBarConnection[];
}

interface GanttBarObject {
  [key: string]: any;
  ganttBarConfig: GanttBarConfig;
}
```

## Chart Data Types

```typescript
interface ChartRow {
  label: string;
  bars: GanttBarObject[];
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

export interface GanttMilestone {
  date: string
  name: string
  description?: string
  color?: string
}
```
## Label Data Types

```typescript
export type LabelColumnField = "Id" | "Label" | "StartDate" | "EndDate" | "Duration"

export type SortFunction = (a: ChartRow, b: ChartRow) => number

interface LabelColumnConfig {
  field: LabelColumnField | string
  sortable?: boolean
  valueGetter?: (row: ChartRow) => string | number
  sortFn?: SortFunction
}
```