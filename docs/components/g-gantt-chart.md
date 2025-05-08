# GGanttChart Component

The GGanttChart component is the main container component for creating Gantt charts in your Vue 3 application. It handles the overall layout, time management, and coordination between all child components.

## Basic Usage

Here's a minimal example of using the GGanttChart component:

```vue
<template>
  <g-gantt-chart
    :chart-start="chartStart"
    :chart-end="chartEnd"
    :precision="precision"
    :bar-start="barStart"
    :bar-end="barEnd"
  >
    <g-gantt-row
      v-for="row in rows"
      :key="row.label"
      :label="row.label"
      :bars="row.bars"
    />
  </g-gantt-chart>
</template>
```

## Component API

### Props

| Prop Name | Type | Default | Description |
|-----------|------|---------|-------------|
| chartStart | `string \| Date` | Required | The start date of the chart's visible range |
| chartEnd | `string \| Date` | Required | The end date of the chart's visible range |
| precision | `'hour' \| 'day' \| 'week' \| 'month'` | `'day'` | Time unit precision for the chart |
| barStart | `string` | Required | Property name for bar start dates |
| barEnd | `string` | Required | Property name for bar end dates |
| width | `string` | `'100%'` | Chart width |
| hideTimeaxis | `boolean` | `false` | Hide the time axis |
| colorScheme | `string \| ColorScheme` | `'default'` | Color scheme for the chart |
| grid | `boolean` | `false` | Show background grid |
| pushOnOverlap | `boolean` | `false` | Push bars when they overlap |
| pushOnConnect | `boolean` | `false` | Push connected bars when moving |
| noOverlap | `boolean` | `false` | Prevent bars from overlapping |
| rowHeight | `number` | `40` | Height of each row in pixels |
| font | `string` | `'inherit'` | Font family for the chart |
| labelColumnTitle | `string` | `''` | Title for the label column |
| labelColumnWidth | `string` | `'150px'` | Width of the label column |
| sortable | `boolean` | `true` | Enable row sorting functionality |
| multiColumnLabel | `LabelColumnConfig[]` | `[]` | Array of columns to display in the header |
| commands | `boolean` | `true` | Show chart control commands |
| enableMinutes | `boolean` | `false` | Enable minutes precision for hour view |
| enableConnections | `boolean` | `true` | Enable connections between bars |
| defaultConnectionType | `ConnectionType` | `'straight'` | Default type for bar connections |
| defaultConnectionColor | `string` | `'#ff0000'` | Default color for connections |
| defaultConnectionPattern | `ConnectionPattern` | `'solid'` | Default pattern for connections |
| defaultConnectionAnimated | `boolean` | `false` | Enable connection animations |
| defaultConnectionAnimationSpeed | `ConnectionSpeed` | `'normal'` | Speed of connection animations |
| maxRows | `number` | `0` | Maximum number of visible rows |
| initialSort | `SortState` | `'none'` | Initial sorting column and direction |
| initialRows | `ChartRow[]` | `[]` | Initial rows data |
| currentTime | `boolean` | `false` | Show current time indicator |
| currentTimeLabel | `string` | `''` | Label for current time indicator |
| dateFormat | `string \| false` | `'YYYY-MM-DD HH:mm'` | Format for dates |
| milestones | `GanttMilestone[]` | `[]` | List of milestone |
| holidayHighlight| `string` | `` | Country Cody of date-holidays |
| rowClass| `(row: ChartRow) => string` | `` | Method to add classes to data rows |
| rowLabelClass| `(row: ChartRow) => string` | `` | Method to add classes to label rows |
| dayOptionLabel| `DayOptionLabel[]` | `['day']` | Customization for time unit day |
| locale| `string` | `'en'` | Locale for dayjs |
| enableRowDragAndDrop| `boolean` | `false` | Enable drag and drop of rows |
| markerConnection| `MarkerConnection` | `forward` | Choose the type of marker in connection |
| showLabel| `boolean` | `true` | Enable the visualization of bar label |
| showProgress| `boolean` | `true` | Enable the visualization of percentage bar progress |
| defaultProgressResizable | `boolean` | `true` | Enable progress adjustment through dragging |
| enableConnectionCreation | `boolean` | `false` | Enable the possibility to draw connections |
| enableConnectionDelete | `boolean` | `false` | Enable the possibility to delete connections |
| utc | `boolean` | `false` | Set the current time position based on UTC |
| barLabelEditable | `boolean` | `false` | Enable the possibility to edit a bar label |
| exportEnabled | `boolean` | `true` | Enable the export functionality |
| exportOptions | `ExportOptions` | `{}` | Configure export options |
| showImporter | `boolean` | `false` | Controls the visibility of the importer dialog |
| importerTitle | `string` | `'Import Data'` | Title for the importer dialog |
| importerDefaultFormat | `ImportFormat` | `'csv'` | Default import format |
| importerAllowedFormats | `ImportFormat[]` | `['msproject', 'jira', 'csv', 'excel']` | List of allowed import formats |
| importerBarStartField | `string` | `'start'` | Default field name for bar start dates in imported data |
| importerBarEndField | `string` | `'end'` | Default field name for bar end dates in imported data |

### Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| click-bar | `{ bar: GanttBarObject, e: MouseEvent, datetime?: string \| Date }` | Bar clicked |
| mousedown-bar | `{ bar: GanttBarObject, e: MouseEvent, datetime?: string \| Date }` | Mouse down on bar |
| mouseup-bar | `{ bar: GanttBarObject, e: MouseEvent, datetime?: string \| Date }` | Mouse up on bar |
| mouseenter-bar | `{ bar: GanttBarObject, e: MouseEvent }` | Mouse enter bar |
| mouseleave-bar | `{ bar: GanttBarObject, e: MouseEvent }` | Mouse leave bar |
| dblclick-bar | `{ bar: GanttBarObject, e: MouseEvent }` | Bar double clicked |
| dragstart-bar | `{ bar: GanttBarObject, e: MouseEvent }` | Bar drag started |
| drag-bar | `{ bar: GanttBarObject, e: MouseEvent }` | Bar being dragged |
| dragend-bar | `{ bar: GanttBarObject, e: MouseEvent, movedBars?: Map<GanttBarObject, { oldStart: string; oldEnd: string } }` | Bar drag ended |
| sort | `{ direction: SortState }` | Sort rows column and direction |
| contextmenu-bar | `{ bar: GanttBarObject; e: MouseEvent; datetime?: string \| Date }`| Contextmenu click|
| group-expansion | `{ rowId: string \| number }` | Open close group bar |
| row-drop | `{ sourceRow: ChartRow; targetRow?: ChartRow; newIndex: number; parentId string \|number }` | Row drop after drag |
| progress-change | `{ bar: GanttBarObject, e: MouseEvent }` | Bar progress change |
| progress-drag-start | `{ bar: GanttBarObject, e: MouseEvent }` | Start progress change |
| progress-drag-end | `{ bar: GanttBarObject, e: MouseEvent }` | End progress change |
| connection-start | `{ sourceBar: GanttBarObject, connectionPoint: ConnectionPoint, e: MouseEvent }` | Starts the creation of a connection |
| connection-drag | `{ sourceBar: GanttBarObject, connectionPoint: ConnectionPoint, currentX: number, currentY: number, e: MouseEvent }` | During connection dragging |
| connection-complete | `{ sourceBar: GanttBarObject, targetBar: GanttBarObject, sourcePoint: ConnectionPoint, targetPoint: ConnectionPoint, e: MouseEvent }` | Completes the creation of a connection |
| connection-cancel | `{ sourceBar: GanttBarObject, connectionPoint: ConnectionPoint, e: MouseEvent }` | Cancels the creation of a connection |
| connection-delete | `{ sourceBar: GanttBarObject, targetBar: GanttBarObject, e: MouseEvent }` | Delete a connection |
| label-edit | `{ sourceBar: GanttBarObject, e: MouseEvent, oldValue: string, newValue: string }` | Edit bar label |
| timeaxisEvents | `TimeaxisEvent[]` | `[]` | Array of events to display on the time axis |
| showEventsAxis | `boolean` | `true` | Controls the visibility of the events axis |
| eventsAxisHeight | `number` | `25` | Sets the height of the events axis in pixels |
| export-start | `format: string` | Emitted when the export process starts |
| export-success | `result: ExportResult` | Emitted when the export process completes successfully |
| export-error | `error: string` | Emitted when the export process encounters an error |
| import-data | `result: ImportResult` | Emitted when data is imported with the import result |

### Slots

### Slots

| Slot Name | Props | Description |
|-----------|-------|-------------|
| default | None | Main content slot for GGanttRow components |
| label-column-title | None | Custom label column header |
| label-column-row | `{ row: ChartRow, value: string \| number }` | Customizes the row in the label column |
| label-column-`{fieldname}` | `{ row: ChartRow, value: string \| number }` | Customizes specific cells based on field name (Label, Id, StartDate, EndDate, Duration, Progress) |
| label-column-`{fieldname}`-group | `{ row: ChartRow, value: string \| number }` | Customizes specific cells for group rows based on field name |
| upper-timeunit | `{ label: string, value: string, date: Date }` | Customizes the upper time unit in the time axis |
| timeunit | `{ label: string, value: string, date: Date }` | Customizes the lower time unit in the time axis |
| current-time-label | None | Custom current time indicator label |
| pointer-marker-tooltips | `{ hitBars: GanttBarObject[], datetime: string }` | Customizes the pointer marker tooltips |
| bar-tooltip | `{ bar: GanttBarObject, barStart: string \| Date, barEnd: string \| Date }` | Custom bar tooltip content |
| bar-label | `{ bar: GanttBarObject }` | Custom bars label content |
| milestone | `{ milestone: GanttMilestone, styleConfig: Object, position: number }` | Custom milestones content |
| milestone-`{milestoneId}` | `{ milestone: GanttMilestone, styleConfig: Object, position: number }` | Custom specific milestone content |
| commands | `CommandSlotProps` | Customization of the command section |
| timeaxis-event | `{ event: TimeaxisEvent }` | Custom template for timeline events displayed on the events axis |

## Command Slot Usage

The `commands` slot allows complete customization of the chart control section. It exposes a comprehensive set of functions and states through the `CommandSlotProps` interface:

```typescript
interface CommandSlotProps {
  // Zoom Controls
  zoomIn: () => void                    // Increase zoom level
  zoomOut: () => void                   // Decrease zoom level
  zoomLevel: Ref<number>                // Current zoom level (1-10)
  
  // Row Navigation
  scrollRowUp: () => void               // Scroll one row up
  scrollRowDown: () => void             // Scroll one row down
  isAtTop: Ref<boolean>                 // Whether scroll is at top
  isAtBottom: Ref<boolean>              // Whether scroll is at bottom
  
  // Group Controls  
  expandAllGroups: () => void           // Expand all group rows
  collapseAllGroups: () => void         // Collapse all group rows
  
  // Timeline Navigation
  handleToStart: () => void             // Scroll to start of timeline
  handleBack: () => void                // Scroll backwards
  handleScroll: () => void              // Handle scroll position change
  handleForward: () => void             // Scroll forwards  
  handleToEnd: () => void               // Scroll to end of timeline
  
  // History Controls
  undo: () => void                      // Undo last action
  redo: () => void                      // Redo last undone action
  canUndo: ComputedRef<boolean>         // Whether undo is available
  canRedo: ComputedRef<boolean>         // Whether redo is available

  // Export Controls
  export: () => void                    // Trigger chart export
}
```

### Example Usage

Here's an example of customizing the command section:

```vue
<template>
  <g-gantt-chart>
    <template #commands="{
      zoomIn,
      zoomOut,
      scrollRowUp,
      scrollRowDown,
      expandAllGroups,
      collapseAllGroups,
      handleToStart,
      handleBack,
      handleForward,
      handleToEnd,
      undo,
      redo,
      canUndo,
      canRedo,
      isAtTop,
      isAtBottom,
      zoomLevel,
      export
    }">
      <div class="custom-commands">
        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <button @click="zoomOut" :disabled="zoomLevel === 1">-</button>
          <span>Zoom: {{ zoomLevel }}x</span>
          <button @click="zoomIn" :disabled="zoomLevel === 10">+</button>
        </div>

        <!-- Navigation Controls -->
        <div class="navigation">
          <button @click="handleToStart">⟪</button>
          <button @click="handleBack">⟨</button>
          <button @click="handleForward">⟩</button>
          <button @click="handleToEnd">⟫</button>
        </div>

        <!-- History Controls -->
        <div class="history">
          <button @click="undo" :disabled="!canUndo">Undo</button>
          <button @click="redo" :disabled="!canRedo">Redo</button>
        </div>

        <!-- Export Controls -->
        <div class="export">
          <button @click="export">Export</button>
        </div>
      </div>
    </template>
  </g-gantt-chart>
</template>
```

The command slot provides complete flexibility in designing your own control interface while maintaining all the core functionality of the Gantt chart. You can choose which controls to expose, customize their appearance, and add additional features as needed.

### Time Management

The GGanttChart component provides precise control over time representation:

```vue
<template>
  <g-gantt-chart
    chart-start="2024-01-01"
    chart-end="2024-12-31"
    precision="day"
    :enable-minutes="true"
    date-format="YYYY-MM-DD HH:mm"
  />
</template>
```

### Keyboard Navigation

The component supports keyboard navigation:
- Arrow keys for moving through the timeline
- +/- for zooming
- Page Up/Down for faster navigation
- Home/End for jumping to start/end
- Ctrl+Z for undo history
- Ctrl+Shift+Z for redo history