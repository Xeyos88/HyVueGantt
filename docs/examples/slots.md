# Slots

Slots in HyVue Gantt allow for advanced customization of various interface components. This guide describes all available slots in detail and provides practical usage examples.

## GGanttChart Slots

### Label Column Customization

```vue
<template>
  <g-gantt-chart>   
    <!-- Customize specific cells -->
    <template #label-column-label="{ row, value }">
      <div class="task-label">
        <span class="icon">📌</span>
        <span>{{ value }}</span>
      </div>
    </template>

    <!-- Customize specific cells group-->
    <template #label-column-label-group="{ row, value }">
      <div class="task-label">
        <span class="header">G-</span>
        <span>{{ value }}</span>
      </div>
    </template>
    
    <!-- Customize the start date column -->
    <template #label-column-startdate="{ value }">
      <div class="date-cell">
        Start date: {{ value }}
      </div>
    </template>
  </g-gantt-chart>
</template>
```

### Time Axis Customization

```vue
<template>
  <g-gantt-chart>
    <!-- Customize upper time units (months, years) -->
    <template #upper-timeunit="{ label, date }">
      <div class="custom-timeunit">
        {{ label }}
        <small>{{ new Date(date).getFullYear() }}</small>
      </div>
    </template>
    
    <!-- Customize lower time units (days, hours) -->
    <template #timeunit="{ label, date }">
      <div class="day-unit" :class="{ 'weekend': isWeekend(date) }">
        {{ label }}
      </div>
    </template>

    <template #holiday-tooltip="{ unit }">
      <div class="holiday-tooltip">
        <strong>{{ unit.holidayName }}</strong>
        <p>Holiday date: {{ formatDate(unit.date) }}</p>
      </div>
    </template>
    
    <!-- Customize event tooltip -->
    <template #event-tooltip="{ event, formatDate }">
      <div class="event-tooltip-custom">
        <h4>{{ event.label }}</h4>
        <div class="event-dates">
          <div>Start: {{ formatDate(event.startDate) }}</div>
          <div>End: {{ formatDate(event.endDate) }}</div>
        </div>
        <div v-if="event.description" class="event-description">
          {{ event.description }}
        </div>
      </div>
    </template>
    
    <!-- Customize event display in the time axis -->
    <template #timeaxis-event="{ event }">
      <div class="custom-event-marker">
        <div class="event-dot"></div>
        <span>{{ event.label }}</span>
      </div>
    </template>
  </g-gantt-chart>
</template>

<script setup>
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}
</script>
```

### Tooltip Customization

```vue
<template>
  <g-gantt-chart>
    <!-- Customize bar tooltips -->
    <template #bar-tooltip="{ bar, barStart, barEnd }">
      <div class="custom-tooltip">
        <h4>{{ bar.ganttBarConfig.label }}</h4>
        <div>Start: {{ formatDate(barStart) }}</div>
        <div>End: {{ formatDate(barEnd) }}</div>
        <div>Duration: {{ calculateDuration(barStart, barEnd) }}</div>
        <div>Progress: {{ bar.ganttBarConfig.progress || 0 }}%</div>
      </div>
    </template>
    
    <!-- Customize pointer marker tooltips -->
    <template #pointer-marker-tooltips="{ hitBars, datetime }">
      <div class="marker-tooltip">
        <div class="tooltip-header">{{ formatDate(datetime) }}</div>
        <div v-if="hitBars.length">
          <div>Tasks at this point:</div>
          <ul>
            <li v-for="bar in hitBars" :key="bar.ganttBarConfig.id">
              {{ bar.ganttBarConfig.label }}
            </li>
          </ul>
        </div>
        <div v-else>No tasks at this point</div>
      </div>
    </template>
  </g-gantt-chart>
</template>
```

### Milestone Customization

```vue
<template>
  <g-gantt-chart>
    <!-- Customize all milestones -->
    <template #milestone="{ milestone, styleConfig, position }">
      <div class="custom-milestone" :style="{ left: `${position}px` }">
        <div class="milestone-diamond" :style="{ background: styleConfig.label.background }"></div>
        <div class="milestone-label">{{ milestone.name }}</div>
      </div>
    </template>
    
    <!-- Customize a specific milestone -->
    <template #milestone-release1="{ milestone }">
      <div class="release-milestone">
        <div class="release-icon">🚀</div>
        <div class="release-name">{{ milestone.name }}</div>
      </div>
    </template>
  </g-gantt-chart>
</template>
```

### Commands Customization

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
      <div class="custom-controls">
        <div class="control-group">
          <button @click="zoomOut" :disabled="zoomLevel === 1">-</button>
          <button @click="zoomIn" :disabled="zoomLevel === 10">+</button>
        </div>
        
        <div class="navigation-group">
          <button @click="handleToStart" :disabled="isAtStart">⏮</button>
          <button @click="handleBack">◀</button>
          <button @click="handleForward">▶</button>
          <button @click="handleToEnd" :disabled="isAtEnd">⏭</button>
        </div>
        
        <div class="history-group">
          <button @click="undo" :disabled="!canUndo">↩</button>
          <button @click="redo" :disabled="!canRedo">↪</button>
        </div>
        
        <div class="export-group">
          <button @click="export">Export</button>
        </div>
      </div>
    </template>
  </g-gantt-chart>
</template>
```

## GGanttRow Slots

The GGanttRow component provides two important slots:

```vue
<template>
  <g-gantt-row label="Development Tasks" :bars="bars">
    <!-- Customize the row label -->
    <template #label>
      <div class="custom-row-label">
        <span class="icon">👨‍💻</span>
        <span>Development Tasks</span>
      </div>
    </template>
    
    <!-- Customize the bar label -->
    <template #bar-label="{ bar }">
      <div class="bar-content">
        <strong>{{ bar.ganttBarConfig.label }}</strong>
        <div v-if="bar.ganttBarConfig.progress">
          {{ bar.ganttBarConfig.progress }}%
        </div>
      </div>
    </template>

     <!-- Customize group bars -->
    <template #group-bar="{ width, height, bar }">
      <div class="custom-group-bar" :style="{ width: width + 'px', height: height + 'px' }">
        <div class="group-decoration" :style="{ background: 'rgba(0,0,0,0.1)' }">
          <div class="group-title">{{ bar.ganttBarConfig.label }}</div>
          <div class="group-progress" 
               :style="{ width: (bar.ganttBarConfig.progress || 0) + '%' }">
          </div>
        </div>
      </div>
    </template>
  </g-gantt-row>
</template>
```

## Using Slots for Complex Layouts

HyVue Gantt slots can be combined to create complex layouts and highly customized interfaces:

```vue
<template>
  <g-gantt-chart>
    <!-- Combine different slots for a customized interface -->
    <template #bar-tooltip>...</template>
    <template #milestone>...</template>
    <template #commands>...</template>
    
    <g-gantt-row v-for="row in rows" :key="row.id" v-bind="row">
      <template #bar-label="{ bar }">...</template>
    </g-gantt-row>
  </g-gantt-chart>
</template>
```

## Slot Reference Table

### GGanttChart Slots

| Slot Name | Props | Description |
|-----------|-------|-------------|
| default | None | Main content slot for GGanttRow components |
| label-column-`{fieldname}` | `{ row: ChartRow, value: string \| number }` | Customizes specific cells based on field name |
| label-column-`{fieldname}`-group | `{ row: ChartRow, value: string \| number }` | Customizes specific cells for group rows based on field name |
| upper-timeunit | `{ label: string, value: string, date: Date }` | Customizes upper time units |
| timeunit | `{ label: string, value: string, date: Date }` | Customizes lower time units |
| current-time-label | None | Custom current time indicator label |
| pointer-marker-tooltips | `{ hitBars: GanttBarObject[], datetime: string }` | Customizes pointer marker tooltips |
| bar-tooltip | `{ bar: GanttBarObject, barStart: string \| Date, barEnd: string \| Date }` | Custom bar tooltip content |
| bar-label | `{ bar: GanttBarObject }` | Custom bars label content |
| milestone | `{ milestone: GanttMilestone, styleConfig: Object, position: number }` | Custom milestones content |
| milestone-`{milestoneId}` | Same as milestone slot | Custom specific milestone content |
| commands | `CommandSlotProps` | Customization of the command section |
| timeaxis-event | `{ event: TimeaxisEvent }` | Custom template for timeline events |
| holiday-tooltip | `{ unit: TimeaxisUnit }` | Customizes the tooltip that appears when hovering over holiday dates |
| event-tooltip | `{ event: TimeaxisEvent, formatDate: Function }` | Customizes the tooltip that appears when hovering over events in the time axis |

### GGanttRow Slots

| Slot Name | Props | Description |
|-----------|-------|-------------|
| label | None | Customizes the row label content |
| bar-label | `{ bar: GanttBarObject }` | Customizes the bar label |
| group-bar | `{ width: number, height: number, bar: GanttBarObject }` | Customizes the appearance of group bars |


## Best Practices for Using Slots

1. **Maintain readability**: Avoid overloading slots with complex logic
2. **Reuse components**: Create custom components for frequently used slots
3. **Performance**: Be mindful of performance when using complex components in slots, especially for repeating elements
4. **Visual consistency**: Maintain a coherent style across all custom slots
5. **Accessibility**: Ensure custom slot components maintain accessibility

By effectively using slots, you can completely customize the appearance and behavior of your Gantt chart while maintaining all core functionality.