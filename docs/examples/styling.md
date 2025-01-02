# Styling Examples

This section demonstrates various styling options available in HyVue Gantt.

## Color Schemes

Example using different built-in color schemes:

```vue
<template>
  <div class="schemes-demo">
    <g-gantt-chart
      v-for="scheme in colorSchemes"
      :key="scheme"
      v-bind="chartConfig"
      :color-scheme="scheme"
      style="margin-bottom: 20px;"
    >
      <g-gantt-row
        v-for="row in rows"
        :key="row.label"
        :label="row.label"
        :bars="row.bars"
      />
    </g-gantt-chart>
  </div>
</template>

<script setup lang="ts">
const colorSchemes = [
  'default',
  'vue',
  'dark',
  'creamy',
  'crimson'
]
</script>
```

## Custom Bar Styles

Example with custom bar styling:

```vue
<template>
  <g-gantt-chart v-bind="chartConfig">
    <g-gantt-row
      v-for="row in rows"
      :key="row.label"
      :label="row.label"
      :bars="row.bars"
    />
  </g-gantt-chart>
</template>

<script setup lang="ts">
const rows = ref([
  {
    label: 'Custom Styles',
    bars: [
      {
        start: '2024-01-01',
        end: '2024-01-15',
        ganttBarConfig: {
          id: '1',
          label: 'Gradient Bar',
          style: {
            background: 'linear-gradient(45deg, #42b883, #35495e)',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      },
      {
        start: '2024-01-20',
        end: '2024-02-10',
        ganttBarConfig: {
          id: '2',
          label: 'Pattern Bar',
          style: {
            background: 'repeating-linear-gradient(45deg, #606dbc, #606dbc 10px, #465298 10px, #465298 20px)',
            color: 'white'
          }
        }
      }
    ]
  }
])
</script>
```

## Time Unit Highlighting

You can highlight specific time units and holidays:

```vue
<template>
  <g-gantt-chart
    :highlighted-hours="[9, 12, 17]"        
    :highlighted-days-in-week="[0, 6]"       
    :highlighted-days-in-month="[1, 15, 30]" 
    :highlighted-months="[0, 6]"             
    :highlighted-week="[1, 52]"              
    :holiday-highlight="'US'"
  >
    <!-- chart content -->
  </g-gantt-chart>
</template>