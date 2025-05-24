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
type ConnectionRelation = 'FS' | 'SS' | 'FF' | 'SF';
```

### Connection Relations

Connection relations define which points of the bars are connected:

- **FS (Finish to Start)**: End of source bar connects to start of target bar (default)
- **SS (Start to Start)**: Start of source bar connects to start of target bar  
- **FF (Finish to Finish)**: End of source bar connects to end of target bar
- **SF (Start to Finish)**: Start of source bar connects to end of target bar

```typescript
const connection = {
  targetId: '2',
  relation: 'FS', // Finish to Start relationship
  type: 'bezier'
};
```

### Basic Labels

Add labels to connections to provide additional context:

```typescript
const connectionWithLabel = {
  targetId: '2',
  type: 'straight',
  label: 'Critical Dependency',
  labelAlwaysVisible: true
};
```

### Label Styling

Customize the appearance of connection labels:

```typescript
const styledConnection = {
  targetId: '2',
  label: 'Important Task',
  labelAlwaysVisible: false, // Show only when connection is selected
  labelStyle: {
    fill: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
};
```

### Advanced Label Styling

All CSS properties are supported for maximum customization:

```typescript
const advancedLabelStyle = {
  fill: '#2c3e50',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'Arial, sans-serif',
  opacity: 0.9,
  textTransform: 'capitalize',
};
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