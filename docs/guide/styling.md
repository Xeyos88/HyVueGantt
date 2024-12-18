# Styling

HyVue Gantt provides extensive styling options to customize the appearance of your Gantt chart. This guide covers all styling aspects from basic colors to advanced customizations.

## Color Schemes

Built-in color schemes are available:

```typescript
<g-gantt-chart :color-scheme="'vue'" />

// Available schemes:
const schemes = [
  'default',
  'creamy',
  'crimson',
  'dark',
  'flare',
  'fuchsia',
  'grove',
  'material-blue',
  'sky',
  'slumber',
  'vue'
];
```

## Custom Bar Styling

Individual bars can be styled:

```typescript
const bar = {
  ganttBarConfig: {
    id: '1',
    style: {
      background: 'linear-gradient(to right, #42b883, #35495e)',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      color: '#ffffff',
      fontWeight: 'bold'
    }
  }
};
```

## Layout Customization

Control the chart's layout:

```typescript
<g-gantt-chart
  :row-height="40"
  :label-column-width="'200px'"
  :font="'Arial, sans-serif'"
  :grid="true"
>
```

## CSS Variables

Override default styles using CSS variables:

```css
.g-gantt-chart {
  --gantt-primary-color: #42b883;
  --gantt-secondary-color: #35495e;
  --gantt-text-color: #2c3e50;
  --gantt-grid-color: #eaeaea;
  --gantt-hover-color: rgba(66, 184, 131, 0.1);
}
```

## Responsive Design

The chart automatically adapts to different screen sizes, but you can customize this behavior:

```typescript
<g-gantt-chart
  :width="'100%'"
  :min-width="'800px'"
  :max-width="'2000px'"
/>
```

Each guide includes practical examples and best practices for implementation. The content is structured to progress from basic concepts to advanced features, maintaining a professional and educational tone throughout.