# Flowise Flow Data Structure Guide

This guide details the critical structure of Flowise chatflow data to ensure proper functionality and UI rendering.

## Overview

The flow data structure consists of two main sections:
1. `nodes` - An array of node objects that define the components and their configurations
2. `edges` - An array of edge objects that define the connections between nodes

## Node Structure

Each node in the `nodes` array must follow this exact structure:

```typescript
{
  // Core Node Properties
  id: string                 // Unique identifier (e.g., "toolAgent_0")
  type: "customNode"         // Always "customNode" for Flowise nodes
  width: number             // Node width in pixels (typically 300)
  height: number            // Node height in pixels (varies by type)
  selected: boolean         // Selection state
  dragging: boolean         // Drag state
  
  // Position Properties (CRITICAL for UI rendering)
  position: {               // Initial position
    x: number              // Precise x coordinate (e.g., 1097.4208657424156)
    y: number              // Precise y coordinate (e.g., 413.78962915804334)
  }
  positionAbsolute: {      // Must match position exactly
    x: number              // Same as position.x
    y: number              // Same as position.y
  }

  // Node Data Configuration
  data: {
    // Core Metadata
    id: string             // Must match parent node id
    label: string          // Display name
    name: string           // Internal name
    type: string           // Node type (e.g., "AgentExecutor", "ChatOpenAI")
    version: number        // Version number
    category: string       // Node category
    description: string    // Node description
    
    // Class Information
    baseClasses: string[]  // Array of base class names
    
    // Parameters
    inputParams: {         // Array of input parameter definitions
      label: string
      name: string
      type: string
      id: string          // Must follow format: "{nodeId}-input-{name}-{type}"
      // ... other param-specific properties
    }[]
    
    // Connection Points
    inputAnchors: {       // Array of input connection definitions
      id: string         // Must follow format: "{nodeId}-input-{name}-{type}"
      label: string
      name: string
      type: string
      // ... other anchor-specific properties
    }[]
    outputAnchors: {     // Array of output connection definitions
      id: string        // Must follow format: "{nodeId}-output-{name}-{types}"
      label: string
      name: string
      type: string
      // ... other anchor-specific properties
    }[]
    
    // Runtime Values
    inputs: {           // Current input values
      [key: string]: any
    }
    outputs: {}        // Always empty object
    selected: false    // Always false
  }
}
```

## Edge Structure

Each edge in the `edges` array must follow this exact structure:

```typescript
{
  id: string           // Format: "{sourceId}-{sourceHandle}-{targetId}-{targetHandle}"
  source: string       // Source node ID
  target: string       // Target node ID
  type: "buttonedge"   // Always "buttonedge"
  sourceHandle: string // Format: "{nodeId}-output-{name}-{types}"
  targetHandle: string // Format: "{nodeId}-input-{name}-{type}"
}
```

## Critical Points

1. **Coordinate Precision**
   - Position coordinates must be exact floating-point numbers
   - Both `position` and `positionAbsolute` must match exactly
   - Coordinates determine node placement in the UI canvas

2. **ID Formats**
   - Node IDs: `{type}_{number}` (e.g., "toolAgent_0")
   - Input param IDs: `{nodeId}-input-{name}-{type}`
   - Input anchor IDs: `{nodeId}-input-{name}-{type}`
   - Output anchor IDs: `{nodeId}-output-{name}-{types}`
   - Edge IDs: Concatenation of source and target handles

3. **Type Consistency**
   - All nodes must have `type: "customNode"`
   - All edges must have `type: "buttonedge"`
   - Node-specific types must match their capabilities

4. **Required Properties**
   - Every node must have all core properties
   - Empty arrays/objects must be included (e.g., `outputs: {}`)
   - Boolean flags must be explicit (e.g., `selected: false`)

## Common Node Types

1. **Tool Agent**
   - Height: 486px
   - Required connections: Tools, Memory, Chat Model
   - System message in inputs

2. **ChatOpenAI**
   - Height: 670px
   - Model configuration in inputs
   - Cache anchor optional

3. **ZepMemory**
   - Height: 427px
   - Memory configuration in inputs
   - No input anchors

4. **Calculator**
   - Height: 143px
   - Minimal configuration
   - Output only

## Validation Checklist

- [ ] All node IDs are unique and properly formatted
- [ ] Position coordinates are exact floating-point numbers
- [ ] All required properties are present
- [ ] Input/output anchors match connected edges
- [ ] Edge IDs correctly reflect their connections
- [ ] Node dimensions match their type requirements
- [ ] No comments or extra properties in the structure

## Example Usage

When creating or modifying flow data:

1. Start with a known working template
2. Maintain exact coordinate precision
3. Follow ID formatting conventions
4. Include all required properties
5. Validate edge connections match anchor definitions
6. Test node dimensions in UI rendering

Remember: The flow data structure maps directly to the UI canvas. Precision in coordinates and proper property formatting is essential for correct visualization and functionality. 