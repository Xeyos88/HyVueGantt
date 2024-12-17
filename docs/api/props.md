# Props API Reference

The HyVue Gantt library exposes a comprehensive set of props through its components. This reference documents all available props and their usage.

## GGanttChart Props

### Time Management Props

These props control the temporal aspects of your Gantt chart:

```typescript
interface TimeManagementProps {
  chartStart: string | Date;        // Start date of visible range
  chartEnd: string | Date;          // End date of visible range
  precision: TimeUnit;              // Time unit precision
  barStart: string;                 // Property name for bar start dates
  barEnd: string;                   // Property name for bar end dates
  dateFormat?: string | false;      // Date format string
  enableMinutes?: boolean;          // Enable minutes precision
  currentTime?: boolean;            // Show current time indicator
  currentTimeLabel?: string;        // Current time indicator label
}
```

### Visual Configuration Props

Props that control the visual appearance:

```typescript
interface VisualProps {
  width?: string;                   // Chart width
  rowHeight?: number;               // Height of each row
  grid?: boolean;                   // Show background grid
  hideTimeaxis?: boolean;           // Hide the time axis
  colorScheme?: string | ColorScheme; // Color scheme
  font?: string;                    // Font family
  labelColumnTitle?: string;        // Label column title
  labelColumnWidth?: string;        // Label column width
  highlightedUnits?: number[];      // Highlighted time units
}
```

### Behavior Props

Props that control chart behavior:

```typescript
interface BehaviorProps {
  pushOnOverlap?: boolean;          // Push overlapping bars
  pushOnConnect?: boolean;          // Push connected bars
  noOverlap?: boolean;              // Prevent bar overlap
  commands?: boolean;               // Show control commands
  maxRows?: number;                 // Maximum visible rows
  initialSortDirection?: SortDirection; // Initial sort direction
}
```

### Connection Props

Props for configuring bar connections:

```typescript
interface ConnectionProps {
  enableConnections?: boolean;      // Enable connections
  defaultConnectionType?: ConnectionType; // Default connection type
  defaultConnectionColor?: string;  // Default connection color
  defaultConnectionPattern?: ConnectionPattern; // Default pattern
  defaultConnectionAnimated?: boolean; // Enable animations
  defaultConnectionAnimationSpeed?: ConnectionSpeed; // Animation speed
}
```

## GGanttRow Props

```typescript
interface GGanttRowProps {
  label: string;                    // Row label
  bars: GanttBarObject[];          // Bar data array
  highlightOnHover?: boolean;      // Highlight on hover
}
```
