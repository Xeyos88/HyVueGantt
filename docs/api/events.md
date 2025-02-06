# Events API Reference

HyVue Gantt components emit various events that you can listen to for interactivity. Below is a comprehensive list of available events.


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

type BarMouseEvent = Omit<GanttBarEvent, "datetime">

interface GanttBarDragEvent extends GanttBarEvent {
  movedBars?: Map<
    GanttBarObject,
    {
      oldStart: string
      oldEnd: string
    }
  >
}

interface RowExpansion {
  rowId: string | number
}

interface SortState {
  column: string
  direction: SortDirection
}

```

### Click Events

```typescript
@click-bar="(event: GanttBarEvent) => void"
@dblclick-bar="(event: GanttBarEvent) => void"
@contextmenu-bar="(event: GanttBarEvent) => void"
```

### Drag Events

```typescript
@dragstart-bar="(event: BarMouseEvent) => void"
@drag-bar="(event: BarMouseEvent) => void"
@dragend-bar="(event: GanttBarDragEvent) => void"
@progress-drag-start="(event: BarMouseEvent) => void"
@progress-change="(event: BarMouseEvent) => void"
@progress-drag-end="(event: BarMouseEvent) => void"
```

### Mouse Events

```typescript
@mouseenter-bar="(event: BarMouseEvent) => void"
@mouseleave-bar="(event: BarMouseEvent) => void"
@mousedown-bar="(event: BarMouseEvent) => void"
@mouseup-bar="(event: BarMouseEvent) => void"
```

## Row Events

```typescript
@row-drop="(event: RowDragEvent)"
@group-expansion="(event: RowExpansion)"
```

## Chart Events

```typescript
@sort="(event: SortState) => void"
```