# OUTDATED!

# Cellular Automata Rules: Complete Documentation

## 1. Introduction
This documentation covers the complete specification for configuring cellular automata simulations using JSON rules. The system supports complex behaviors through mathematical expressions, custom neighborhood definitions, and flexible state transitions with toroidal grid boundaries.

## 2. Core Structure
```json
{
  "types": [],    // Supported cell states
  "kernels": {},  // Neighborhood patterns
  "default": {},  // Fallback settings
  "behavior": []  // State transition rules
}
```

## 3. Toroidal Grid System
### Key Properties:
- **Seamless wrapping**: Cells on opposite edges are neighbors
- **Coordinate calculation**:
  - neighbor_x = (x + offset + grid_width) % grid_width
  - neighbor_y = (y + offset + grid_height) % grid_height
- **Visualization**:
  ```
  A B C    Edge neighbors:  
  D E F    Top of A → Bottom row  
  G H I    Left of A → Right column
  ```
- **Behavior**:
  - Patterns crossing boundaries reappear on opposite sides
  - All cells have identical neighborhood structures
  - No edge effects in simulations

## 4. Expression System
### Available In:
`types`, `from`, `to`, `elseTo`, `value`, `count`, kernel weights

### Operators:
| Operator | Meaning | Example |
|----------|---------|---------|
| `^` | Exponentiation | `2^3` → 8 |
| `&` | Logical AND | `x>5 & y<10` |
| `\|` | Logical OR | `x<0 \| x>10` |
| `=` | Equality | `state=1` |

### Functions:
| Category | Functions |
|----------|-----------|
| **Math** | `abs`, `sqrt`, `exp`, `log`, `pow` |
| **Trig** | `sin`, `cos`, `tan`, `asin`, `acos` |
| **Stats** | `min`, `max`, `round` |
| **Special** | `mod`, `factorial`, `sigmoid`, `random` |

### Constants:
`pi`, `e`, `tau`, `infinity`, `phi`

### Context Variables:
| Location | Variables | Description |
|----------|-----------|-------------|
| **Kernels** | `x`, `y`, `row`, `column` | Neighbor position |
| **Rules** | `x`, `y` | Current cell position |

## 5. Kernel Specification
### Properties:
- **Automatic centering**: Padded to odd dimensions
- **Weight interpretation**:
  - Positive values: Add to count
  - Zero: Ignore position
  - Negative values: Subtract from count
- **Self-inclusion**: Center weight affects current cell

### Format:
```json
"kernels": {
  "gradient": [
    ["max(0,1-abs(row))", "0.5", "0.1"],
    ["0.5", 0, "0.5"],
    ["0.1", "0.5", "max(0,1-abs(row))"]
  ]
}
```

## 6. Behavior Rules
### Rule Structure:
```json
{
  "from": ["expression"],      // Source states
  "neighborsAnd": [{           // ALL must pass
    "value": ["expression"],   // States to count
    "sign": "operator",        // Comparison operator
    "count": "expression",     // Threshold
    "kernel": "name"           // Optional override
  }],
  "neighborsOr": [{            // ANY must pass
    "value": [3,4],
    "sign": "!=",
    "count": 0
  }],
  "boolean": "and",            // Combine groups
  "to": "expression",          // New state
  "elseTo": "expression"       // Fallback state
}
```

### Condition Groups:
| Group | Required | Behavior |
|-------|----------|----------|
| `neighborsAnd` | No | **ALL** conditions must pass |
| `neighborsOr` | No | **AT LEAST ONE** condition must pass |

### Boolean Logic:
```json
"boolean": "and"  // or "or"
```
- **Default**: `"and"`
- **Combination Rules**:
  - `"and"`: Both groups must pass
  - `"or"`: Either group must pass
- **Special Cases**:
  - Both groups missing → Rule always applies
  - One group missing → Treated as `true` for `"and"`, `false` for `"or"`

### Comparison Operators:
| Sign | Meaning | True When |
|------|---------|-----------|
| `=` | Equal | total == count |
| `!=` | Not equal | total ≠ count |
| `>` | Greater than | total > count |
| `<` | Less than | total < count |
| `>=` | Greater or equal | total ≥ count |
| `<=` | Less or equal | total ≤ count |

## 7. State Transition Logic
### Evaluation Process:
1. **Top-to-bottom** rule evaluation
2. For each cell:
   a. Compile `from` expressions with cell's `(x,y)`
   b. If state matches ANY compiled `from` value:
      - Evaluate `neighborsAnd` and `neighborsOr`
      - Apply `boolean` logic
      - Conditions pass → Set to compiled `to`
      - Conditions fail → Set to compiled `elseTo` (or keep current)
   c. **Stop processing** after first matching rule

## 8. Complete Examples

### Conway's Game of Life:
```json
{
  "kernels": {
    "moore": [
      [1,1,1],
      [1,0,1],
      [1,1,1]
    ]
  },
  "behavior": [
    {
      "from": [0],
      "neighborsAnd": [{
        "value": [1],
        "sign": "=",
        "count": 3
      }],
      "to": 1
    },
    {
      "from": [1],
      "neighborsOr": [
        {"value": [1], "sign": "<", "count": 2},
        {"value": [1], "sign": ">", "count": 3}
      ],
      "boolean": "or",
      "to": 0,
      "elseTo": 1
    }
  ]
}
```

### Forest Fire Simulation:
```json
{
  "types": [0, 1, 2],
  "behavior": [
    {
      "from": [0],
      "to": "random() < 0.01 ? 1 : 0"
    },
    {
      "from": [1],
      "neighborsAnd": [{
        "value": [2],
        "sign": ">=",
        "count": 1
      }],
      "to": 2
    },
    {
      "from": [2],
      "to": 0
    }
  ]
}
```

### Advanced Pattern Formation:
```json
{
  "kernels": {
    "wave": [
      ["sin(pi*x/10)", "cos(pi*y/10)", "0.2"],
      ["0.5", 0, "0.5"],
      ["0.1", "abs(column)", "sin(pi*x/10)"]
    ]
  },
  "behavior": [
    {
      "from": [0],
      "to": "mod(x + y, 4)"
    },
    {
      "from": [1,2,3],
      "neighborsAnd": [{
        "value": ["state > 1"],
        "sign": ">=",
        "count": "2 + sin(y/3)",
        "kernel": "wave"
      }],
      "to": "min(3, state + 1)"
    }
  ]
}
```

## 9. Edge Case Handling

| Case | System Behavior |
|------|-----------------|
| **Empty `value` array** | Condition always fails |
| **Invalid `sign`** | Defaults to `=` |
| **Missing `kernel`** | Fallback to default → Moore |
| `count` = `NaN` | Condition fails |
| **Undefined state** | Added to type system dynamically |
| **Expression error** | Evaluates to `NaN` |
| **Grid boundaries** | Toroidal wrapping applied |

## 10. Best Practices

### Rule Design:
1. **Order rules** from specific to general
2. **Combine conditions**:
   ```json
   // Co-dependent requirements
   "neighborsAnd"
   
   // Alternative pathways
   "neighborsOr"
   ```
3. **Use `elseTo`** for fallback states
4. **Leverage expressions** for:
   - Position-dependent rules
   - Probabilistic transitions
   - Dynamic thresholds

### Performance Optimization:
1. **Kernel design**:
   - Prefer small kernels (3x3)
   - Use numeric weights when possible
   - Minimize non-zero values
2. **Expression efficiency**:
   ```json
   "count": "const c=cos(x); c>0 ? c*2 : 0"  // Cache operations
   ```
3. **Testing**:
   - Start with 5x5 grids
   - Verify boundary wrapping
   - Use `"to": "x"` for coordinate visualization

### Debugging:
| Issue | Diagnostic Approach |
|-------|---------------------|
| No changes | Check `from` matches cell states |
| Unexpected patterns | Verify condition operators |
| Boundary artifacts | Test toroidal wrapping |
| Performance issues | Simplify complex expressions |

This documentation provides complete specifications for configuring cellular automata simulations, including all aspects of toroidal boundaries, expression handling, and rule evaluation logic. The system enables modeling of biological systems, physical simulations, neural networks, and artistic pattern generation.