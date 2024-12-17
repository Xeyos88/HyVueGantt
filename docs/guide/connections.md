# Connections

Connections in HyVue Gantt allow you to visualize relationships and dependencies between tasks. This guide covers all aspects of implementing and customizing connections.

## Basic Connection Setup

To create a connection between bars:

```typescript
const bars = [
  {
    ganttBarConfig: {
      id: '1',
      connections: [
        {
          targetId: '2',
          type: 'straight',
          color: '#ff0000',
          pattern: 'solid'
        }
      ]
    }
  }
];
```

## Connection Types

Available connection types:

```typescript
type ConnectionType = 'straight' | 'bezier' | 'squared';
type ConnectionPattern = 'solid' | 'dash' | 'dot' | 'dashdot';
```

### Animation Options

Enhance connections with animations:

```typescript
const animatedConnection = {
  targetId: '2',
  type: 'bezier',
  animated: true,
  animationSpeed: 'normal' // 'slow' | 'normal' | 'fast'
};
```

## Dependency Management

Handle task dependencies effectively:

```typescript
interface Connection {
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  pushOnConnect?: boolean;
  style?: CSSProperties;
}
```