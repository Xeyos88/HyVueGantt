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
  utc?: boolean;                    // Use UTC time for current marker
}
```

### Visual Configuration Props

Props that control the visual appearance:

```typescript
interface VisualProps {
  width?: string;                            // Chart width
  rowHeight?: number;                        // Height of each row
  grid?: boolean;                            // Show background grid
  hideTimeaxis?: boolean;                    // Hide the time axis
  colorScheme?: string | ColorScheme;        // Color scheme
  font?: string;                             // Font family
  labelColumnTitle?: string;                 // Label column title
  labelColumnWidth?: number;                 // Label column width
  holidayHighlight?: string;                 // Country code for date-holidays
  rowClass?: (row: ChartRow) => string;      // Method to add classes to data rows
  rowLabelClass?: (row: ChartRow) => string; // Method to add classes to label rows
  dayOptionLabel?: DayOptionLabel[];         // Customization for time unit day
  highlightedHours?: number[];               // Array of hours to highlight (0-23)
  highlightedDaysInWeek?: number[];          // Array of days to highlight (0-6, 0 is Sunday)
  highlightedDaysInMonth?: number[];         // Array of days to highlight (1-31)
  highlightedMonths?: number[];              // Array of months to highlight (0-11, 0 is January)
  highlightedWeek?: number[];                // Array of weeks to highlight (1-53)
  locale?: string;                           // Locale for dayjs
  markConnection?: MarkConnection;           // Type of marker in connections
  showLabel?: boolean;                       // Show bar labels
  showProgress?: boolean;                    // Show progress indicators
  showEventsAxis?: boolean;                  // Show events axis
  eventsAxisHeight?: number;                 // Height of events axis
  timeaxisEvents?: TimeaxisEvent[];          // Events to display on time axis
}
```

### Behavior Props

Props that control chart behavior:

```typescript
interface BehaviorProps {
  pushOnOverlap?: boolean;                  // Push overlapping bars
  pushOnConnect?: boolean;                  // Push connected bars
  noOverlap?: boolean;                      // Prevent bar overlap
  commands?: boolean;                       // Show control commands
  maxRows?: number;                         // Maximum visible rows
  initialSortDirection?: SortState;         // Initial sort direction
  enableRowDragAndDrop?: boolean;           // Enable row drag and drop
  defaultProgressResizable?: boolean;       // Enable progress bar resizing
  barLabelEditable?: boolean;               // Allow editing bar labels
  enableConnectionCreation?: boolean;       // Enable creating connections
  enableConnectionDeletion?: boolean;       // Enable deleting connections
}
```

### Connection Props

Props for configuring bar connections:

```typescript
interface ConnectionProps {
  enableConnections?: boolean;               // Enable connections
  defaultConnectionType?: ConnectionType;     // Default connection type
  defaultConnectionColor?: string;            // Default connection color
  defaultConnectionPattern?: ConnectionPattern; // Default pattern
  defaultConnectionAnimated?: boolean;        // Enable animations
  defaultConnectionAnimationSpeed?: ConnectionSpeed; // Animation speed
}
```

### Export Props

Props for configuring chart export functionality:

```typescript
interface ExportProps {
  exportEnabled?: boolean;                  // Enable export feature
  exportOptions?: ExportOptions;            // Export configuration options
}

interface ExportOptions {
  format: "pdf" | "png" | "svg" | "excel";  // Export format
  quality?: number;                         // Image quality (0-1)
  paperSize?: "a4" | "a3" | "letter" | "legal"; // PDF paper size
  orientation?: "portrait" | "landscape";    // PDF orientation
  scale?: number;                           // Export scale factor
  margin?: number;                          // Margin in pixels
  filename?: string;                        // Output filename
  exportColumnLabel?: boolean;              // Include label column in export
}
```

### Import Props

Props for configuring chart import functionality:

```typescript
interface ImportProps {
  showImporter?: boolean;                    // Show import dialog
  importerTitle?: string;                    // Import dialog title
  importerDefaultFormat?: ImportFormat;      // Default import format
  importerAllowedFormats?: ImportFormat[];   // Allowed import formats
  importerBarStartField?: string;            // Field name for bar start dates
  importerBarEndField?: string;              // Field name for bar end dates
}

type ImportFormat = "jira" | "csv" | "excel";
```

## GGanttRow Props

```typescript
interface GGanttRowProps {
  label: string;                   // Row label
  bars: GanttBarObject[];          // Bar data array
  highlightOnHover?: boolean;      // Highlight on hover
  id?: string | number;            // Row identifier
  children?: { id: string | number; label: string; bars: GanttBarObject[] }[]; // Child rows
  connections?: GanttBarConnection[]; // Row-level connections
}
```