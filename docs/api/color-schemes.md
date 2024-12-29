# Color Schemes Reference

HyVue Gantt provides several built-in color schemes and allows for custom color scheme definitions.

## Built-in Schemes

```typescript
type ColorScheme = {
  primary: Color;
  secondary: Color;
  ternary: Color;
  quartenary: Color;
  hoverHighlight: Color;
  markerCurrentTime: Color;
  text: Color;
  background: Color;
  toast?: Color;
  commands?: Color;
  rangeHighlight?: Color;
  holidayHighlight?: Color;
};

const availableSchemes = {
  default: {
    primary: '#eeeeee',
    secondary: '#E0E0E0',
    ternary: '#F5F5F5',
    quartenary: '#ededed',
    hoverHighlight: 'rgba(204, 216, 219, 0.5)',
    markerCurrentTime: '#000',
    text: '#404040',
    background: 'white',
    commands: "#eeeeee",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },
  vue: {
    primary: '#258a5d',
    secondary: '#41B883',
    ternary: '#35495E',
    quartenary: '#2a3d51',
    hoverHighlight: 'rgba(160, 219, 171, 0.5)',
    markerCurrentTime: '#000',
    text: 'white',
    background: 'white',
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "#f7842d"
  }
  // Additional schemes available...
};
```

## Using Color Schemes

To apply a built-in color scheme:

```typescript
<g-gantt-chart color-scheme="vue" />
```

To define a custom color scheme:

```typescript
const customScheme: ColorScheme = {
  primary: '#your-color',
  secondary: '#your-color',
  ternary: '#your-color',
  quartenary: '#your-color',
  hoverHighlight: 'rgba(r, g, b, a)',
  markerCurrentTime: '#your-color',
  text: '#your-color',
  background: '#your-color'
};

<g-gantt-chart :color-scheme="customScheme" />
```

Each color scheme provides a consistent visual theme across all chart elements, ensuring a cohesive appearance for your Gantt chart.