# Events API Reference

HyVue Gantt emits various events that you can listen to for interactivity. Below is a comprehensive list of available events.

## Event Interfaces

```typescript
interface GanttBarEvent {
  bar: GanttBarObject;
  e: MouseEvent;
  datetime?: string | Date;
}

interface GanttBarDragEvent extends GanttBarEvent {
  movedBars?: Map<
    GanttBarObject,
    {
      oldStart: string
      oldEnd: string
    }
  >
}

interface RowDragEvent {
  sourceRow: ChartRow;
  targetRow?: ChartRow;
  newIndex: number;
  parentId?: string | number;
}

interface ConnectionStartEvent {
  sourceBar: GanttBarObject;
  connectionPoint: ConnectionPoint;
  e: MouseEvent;
}

interface ConnectionCompleteEvent {
  sourceBar: GanttBarObject;
  targetBar: GanttBarObject;
  sourcePoint: ConnectionPoint;
  targetPoint: ConnectionPoint;
  e: MouseEvent;
}

interface ConnectionDeleteEvent {
  sourceBar: GanttBarObject
  targetBar: GanttBarObject
  e: MouseEvent
}

interface LabelEditEvent {
  bar: GanttBarObject
  oldValue: string
  newValue: string
  e: MouseEvent
}

interface ImportResult {
  success: boolean;
  data?: {
    rows: ChartRow[];
    chartStart?: string | Date;
    chartEnd?: string | Date;
  };
  error?: string;
  warnings?: string[];
}

interface RangeSelectionEvent {
  row: ChartRow
  startDate: string | Date
  endDate: string | Date
  e: MouseEvent
}
```

## Bar Events

### Mouse Events
```typescript
@click-bar="(event: GanttBarEvent) => void"
@dblclick-bar="(event: LabelEditEvent) => void"
@contextmenu-bar="(event: GanttBarEvent) => void"
@mouseenter-bar="(event: BarMouseEvent) => void"
@mouseleave-bar="(event: BarMouseEvent) => void"
@mousedown-bar="(event: BarMouseEvent) => void"
@mouseup-bar="(event: BarMouseEvent) => void"
```

### Drag Events
```typescript
@dragstart-bar="(event: BarMouseEvent) => void"
@drag-bar="(event: BarMouseEvent) => void"
@dragend-bar="(event: GanttBarDragEvent) => void"
```

### Progress Events
```typescript
@progress-drag-start="(event: BarMouseEvent) => void"
@progress-change="(event: BarMouseEvent) => void"
@progress-drag-end="(event: BarMouseEvent) => void"
```

## Row Events

```typescript
@row-drop="(event: RowDragEvent) => void"
@group-expansion="(event: { rowId: string | number }) => void"
```

## Export Events

```typescript
@export-start="(format: string) => void"
@export-success="(result: ExportResult) => void"
@export-error="(error: string) => void"
```

## Import Events

```typescript
@import-data="(result: ImportResult) => void"
```

## Connection Events

```typescript
@connection-start="(event: ConnectionStartEvent) => void"
@connection-drag="(event: ConnectionDragEvent) => void"
@connection-complete="(event: ConnectionCompleteEvent) => void"
@connection-cancel="(event: ConnectionStartEvent) => void"
@connection-delete="(event: ConnectionDeleteEvent) => void"
```

## Chart Events

```typescript
@sort="(event: { sortState: SortState }) => void"
@range-selection="(event: RangeSelectionEvent) => void"
```