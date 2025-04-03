# Color Schemes

HyVue Gantt provides a comprehensive set of predefined color schemes to customize the appearance of your Gantt chart. Each scheme has been carefully designed to ensure maximum readability and visual consistency.

## Base Structure

Each color scheme is defined by a `ColorScheme` object that includes all necessary properties for complete interface customization:

```typescript
interface ColorScheme {
  primary: Color;
  secondary: Color;
  ternary: Color;
  quartenary: Color;
  hoverHighlight: Color;
  markerCurrentTime: Color;
  text: Color;
  background: Color;
  commands?: Color;
  rangeHighlight?: Color;
  holidayHighlight?: Color;
  barContainer?: Color;
  rowContainer?: Color;
  gridAndBorder?: Color;
}
```

## Predefined Schemes

The library includes the following predefined schemes:

### Default
The default scheme offers a professional and neutral appearance:
```typescript
{
  primary: '#eeeeee',
  secondary: '#E0E0E0',
  ternary: '#F5F5F5',
  quartenary: '#ededed',
  hoverHighlight: 'rgba(204, 216, 219, 0.5)',
  markerCurrentTime: '#000',
  text: '#404040',
  background: 'white',
  commands: '#eeeeee',
  rangeHighlight: '#000',
  holidayHighlight: 'rgba(240, 120, 96, 0.8)',
  barContainer: 'rgba(0, 0, 0, 0.7)',
  rowContainer: 'rgba(255, 255, 255, 1)'
}
```

### Vue
A scheme inspired by Vue.js official colors:
```typescript
{
  primary: '#258a5d',
  secondary: '#41B883',
  ternary: '#35495E',
  quartenary: '#2a3d51',
  hoverHighlight: 'rgba(160, 219, 171, 0.5)',
  markerCurrentTime: '#000',
  text: 'white',
  background: 'white',
  commands: 'white',
  rangeHighlight: '#000',
  holidayHighlight: '#f7842d',
  barContainer: '#258a5d',
  rowContainer: 'rgba(0, 0, 0, 1)'
}
```

## Using Schemes

You can apply a predefined scheme by simply specifying its name:

```vue
<template>
  <g-gantt-chart color-scheme="vue">
    <!-- chart content -->
  </g-gantt-chart>
</template>
```

## Custom Scheme

You can create a custom scheme by defining an object that implements the `ColorScheme` interface:

```vue
<script setup lang="ts">
const customScheme: ColorScheme = {
  primary: '#4a90e2',
  secondary: '#357abd',
  ternary: '#d4e4f7',
  quartenary: '#e1ecf7',
  hoverHighlight: 'rgba(74, 144, 226, 0.1)',
  markerCurrentTime: '#4a90e2',
  text: '#2c3e50',
  background: '#ffffff',
  commands: '#ffffff',
  rangeHighlight: '#4a90e2',
  holidayHighlight: 'rgba(240, 120, 96, 0.8)',
  barContainer: 'rgba(74, 144, 226, 0.7)',
  rowContainer: 'rgba(255, 255, 255, 1)'
}
</script>

<template>
  <g-gantt-chart :color-scheme="customScheme">
    <!-- chart content -->
  </g-gantt-chart>
</template>
```

## Group Management

The new `barContainer` and `rowContainer` colors are particularly important for the visual management of group rows:

- `barContainer`: Controls the background color of bars when they belong to a group
- `rowContainer`: Defines the background color of the row when it's a group container

This allows creating a clear visual hierarchy in the chart:

```vue
<script setup lang="ts">
const groupAwareScheme: ColorScheme = {
  // ... other colors ...
  barContainer: 'rgba(0, 0, 0, 0.7)',  // Semi-transparent group bars
  rowContainer: 'rgba(255, 255, 255, 1)' // Light background for containers
}
</script>
```

## Best Practices

1. Maintain sufficient contrast between text and background
2. Use consistent colors for related elements
3. Consider accessibility in color choices
4. Use transparencies for overlays
5. Test the scheme with different data types and structures

## Additional Schemes

Besides the schemes shown above, the library also includes:
- `creamy`: For a warm and welcoming look
- `dark`: Perfect for dark themes
- `slumber`: Ideal for night-mode applications
- `sky`: A light and professional theme
- `material-blue`: Inspired by Material Design
- And more...

Each scheme has been optimized to work with both flat and hierarchical structures, always ensuring maximum interface readability and usability.