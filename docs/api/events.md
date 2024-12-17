# Events API Reference

HyVue Gantt components emit various events that you can listen to for interactivity. Below is a comprehensive list of available events.

## Bar Events

Events related to bar interactions:

### Click Events
```typescript
interface BarClickEvent {
  bar: GanttBarObject;
  e: MouseEvent;
  datetime?: string | Date;
}

// Usage
@click-bar="(event: BarClickEvent) => void"
@dblclick-bar="(event: BarClickEvent) => void"
```

### Drag Events
```typescript
interface BarDragEvent {
  bar: GanttBarObject;
  e: MouseEvent;
  movedBars?: Map<GanttBarObject, {
    oldStart: string;
    oldEnd: string;
  }>;
}

// Usage
@dragstart-bar="(event: BarDragEvent) => void"
@drag-bar="(event: BarDragEvent) => void"
@dragend-bar="(event: BarDragEvent) => void"
```

### Mouse Events
```typescript
interface BarMouseEvent {
  bar: GanttBarObject;
  e: MouseEvent;
}

// Usage
@mouseenter-bar="(event: BarMouseEvent) => void"
@mouseleave-bar="(event: BarMouseEvent) => void"
@mousedown-bar="(event: BarMouseEvent) => void"
@mouseup-bar="(event: BarMouseEvent) => void"
```

## Row Events

```typescript
interface RowDropEvent {
  e: MouseEvent;
  datetime: string | Date;
}

// Usage
@drop="(event: RowDropEvent) => void"
```

## Chart Events

```typescript
interface SortEvent {
  direction: SortDirection;
}

// Usage
@sort="(event: SortEvent) => void"
```