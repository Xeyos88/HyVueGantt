# Time Management Examples

This section demonstrates various time-related features.

## Different Time Precisions

```vue
<template>
  <div class="precision-demo">
    <select v-model="currentPrecision">
      <option v-for="p in precisions" :key="p" :value="p">
        {{ p }}
      </option>
    </select>

    <g-gantt-chart
      v-bind="chartConfig"
      :precision="currentPrecision"
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
const precisions = ['hour', 'day', 'week', 'month']
const currentPrecision = ref('day')
</script>
```

## Current Time Indicator

```vue
<template>
  <g-gantt-chart
    v-bind="chartConfig"
    :current-time="true"
    current-time-label="Now"
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