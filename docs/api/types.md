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
type MarkerConnection = 'none' | 'forward' | 'bidirectional'
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
  milestoneId?: string;
  progress?: number;
  progressResizable?: boolean;
  progressStyle?: CSSProperties;
}

interface GanttBarObject {
  [key: string]: any;
  ganttBarConfig: GanttBarConfig;
}

interface GanttBarConnection {
  targetId: string;
  type?: ConnectionType;
  color?: string;
  pattern?: ConnectionPattern;
  animated?: boolean;
  animationSpeed?: ConnectionSpeed;
}
```

## Chart Data Types

```typescript
interface ChartRow {
  id?: string | number
  label: string
  bars: GanttBarObject[]
  children?: ChartRow[]
}

interface GanttMilestone {
  id: string
  date: string
  name: string
  description?: string
  color?: string
}

interface TimeaxisEvent {
  id: string;              
  label: string;          
  startDate: string | Date; 
  endDate: string | Date;   
  color?: string;          
  backgroundColor?: string; 
  description?: string;    
}
```

## Label Data Types

```typescript
type LabelColumnField = "Id" | "Label" | "StartDate" | "EndDate" | "Duration" | "Progress"

type SortFunction = (a: ChartRow, b: ChartRow) => number
type SortDirection = "asc" | "desc" | "none"

interface LabelColumnConfig {
  field: LabelColumnField | string
  sortable?: boolean
  valueGetter?: (row: ChartRow) => string | number
  sortFn?: SortFunction
}

interface SortState {
  column: string;
  direction: SortDirection;
}
```

## Export Types
```typescript
interface ExportOptions {
  format: "pdf" | "png" | "svg" | "excel";
  quality?: number;
  showGrid?: boolean;
  timeRange?: { start: Date; end: Date };
  filename?: string;
  paperSize?: "a4" | "a3" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  scale?: number;
  includeHeader?: boolean;
  includeTimeline?: boolean;
  margin?: number;
}

interface ExportResult {
  success: boolean;
  data: Blob | null;
  error?: string;
  filename: string;
}
```

## Style Types

```typescript
interface ColorScheme {
  primary: string;
  secondary: string;
  ternary: string;
  quartenary: string;
  hoverHighlight: string;
  markerCurrentTime: string;
  text: string;
  background: string;
  toast?: string;
  commands?: string;
  rangeHighlight?: string;
  holidayHighlight?: string;
  barContainer?: string;
  rowContainer?: string;
  gridAndBorder?: string;
}
```