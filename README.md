# Comprehensive JSON Rule Specification for the Life Engine

This guide covers every nuance of authoring JSON rule sets for the Life class. You’ll learn how to  
- write mathematical expressions,  
- choose or define neighborhood kernels,  
- understand grid wrapping,  
- apply multi‐kernel rules,  
- leverage coordinate variables and custom functions,  
- and manage advanced, multi‐phase rule pipelines.

---

## Table of Contents

1. Root Object Structure  
2. Mathematical Expressions & the Compiler  
3. Neighborhood Kernels and Grid Wrapping  
4. Default Settings  
5. Behavior Rules: Anatomy & Execution Flow  
6. Multi-Kernel and Multi-Phase Rules  
7. Advanced Features & Tips  
8. Validation Checklist  

---

## 1. Root Object Structure

Every rule set is a JSON object with these top-level keys:

| Key       | Type    | Required | Description                                                   |
|-----------|---------|----------|---------------------------------------------------------------|
| types     | array   | yes      | All possible cell values (literals or formulas).              |
| kernels   | object  | no       | Named 2D weight matrices for neighbor counting.              |
| default   | object  | no       | Fallback settings (e.g., default kernel).                     |
| behavior  | array   | yes      | Ordered list of transition rules evaluated each tick.         |

```json
{
  "types": [0, 1],
  "kernels": { /* see §3 */ },
  "default": { /* see §4 */ },
  "behavior": [ /* see §5 */ ]
}
```

---

## 2. Mathematical Expressions & the Compiler

All numeric fields (`types`, `from`, `value`, `count`, `to`, `elseTo`) accept:

- integer or float literals (`3`, `0.5`, `2e-3`)  
- quoted formulas (`"x + y"`, `"sin(pi * x)"`)  

### 2.1 Available Variables

Within formulas, these variables are in scope:

| Name   | Meaning                              |
|--------|--------------------------------------|
| x      | column index of the target cell      |
| y      | row index of the target cell         |
| row    | relative kernel row (negative above) |
| column | relative kernel col (negative left)  |

### 2.2 Supported Functions & Constants

The compiler exposes standard JS math plus helpers:

| Function/Constant | Syntax            | Returns                                      |
|-------------------|-------------------|----------------------------------------------|
| sine              | sin(x)            | Math.sin(x)                                  |
| cosine            | cos(x)            | Math.cos(x)                                  |
| tangent           | tan(x)            | Math.tan(x)                                  |
| logarithm         | ln(x) / log(x,y)  | natural / base-y log                         |
| power             | pow(x,y) or x^y   | x raised to y                                |
| sqrt              | sqrt(x)           | Math.sqrt(x)                                 |
| abs               | abs(x)            | absolute value                               |
| random            | random(min,max)   | uniform random in [min, max)                 |
| pi                | pi                | Math.PI                                      |
| e                 | e                 | Math.E                                       |
| tau               | tau               | 2*Math.PI                                    |
| factorial         | factorial(n)      | n!                                            |

For a full list, refer to the engine’s `functions` table.

### 2.3 Implicit Multiplication

Writing `2x + 3(y + 1)` is supported. The tokenizer will insert `*` between:

- number & variable (`2x` → `2 * x`)  
- closing parenthesis & number/variable/parenthesis (`)(` → `)*(`)

---

## 3. Neighborhood Kernels and Grid Wrapping

A kernel is a rectangular matrix of non-negative weights. By default, the engine uses toroidal (wrap-around) edges.

```json
"kernels": {
  "moore": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1]
  ],
  "vonNeumann": [
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0]
  ]
}
```

### 3.1 Toroidal Wrap

When counting a neighbor at (x + dx, y + dy):

```
nx = (x + dx + width) % width  
ny = (y + dy + height) % height  
```

No special rule is needed; all kernels use wrap-around by default.

### 3.2 Inline Kernels

You can override per-rule with an inline matrix:

```json
"condition": {
  "kernel": [
    [0.5, 1, 0.5],
    [1,   0, 1],
    [0.5, 1, 0.5]
  ],
  "value": [1], "sign": ">", "count": 4
}
```

---

## 4. Default Settings

Use the `default` object to avoid repeating common settings:

```json
"default": {
  "kernel": "moore"
}
```

If a rule omits `condition.kernel`, the engine falls back to `default.kernel`.

---

## 5. Behavior Rules: Anatomy & Execution Flow

The `behavior` array is processed in order. For each cell:

1. Evaluate each rule until one applies.  
2. Stop after the first match.  
3. Write to a cloned grid (all updates happen in parallel).

### 5.1 Rule Schema

| Key        | Type     | Required | Description                                           |
|------------|----------|----------|-------------------------------------------------------|
| from       | array    | yes      | Cell values that may trigger this rule.              |
| condition  | object   | no       | Logical test on neighbor counts. Always true if omitted. |
| to         | literal  | yes      | New value if `condition` is true.                     |
| elseTo     | literal  | no       | New value if `condition` is false (otherwise keeps old value). |

```json
{
  "from": [1],
  "condition": { /* see §5.2 */ },
  "to": 0,
  "elseTo": 1
}
```

### 5.2 Condition Objects

#### Leaf Condition

```json
{
  "value": [1, "2*y"], 
  "sign": "<=", 
  "count": "3 + (x%2)", 
  "kernel": "vonNeumann"
}
```

- `value`: neighbor types to count (each entry is formula→number).  
- `sign`: comparison operator (`=`, `!=`, `<`, `<=`, `>`, `>=`).  
- `count`: target number (formula).  
- `kernel`: optional override.

#### Logical Composition

Combine multiple tests:

```json
{
  "and": [
    { "value": [1], "sign": "=", "count": 2 },
    { "value": [2], "sign": ">", "count": "x" }
  ]
}
```

```json
{
  "or": [
    { /* leaf */ },
    { /* leaf */ }
  ]
}
```

Arbitrary nesting of `and`/`or` is supported.

---

## 6. Multi-Kernel and Multi-Phase Rules

### 6.1 Multi-Kernel Rules

A single rule may reference several kernels via nested conditions:

```json
{
  "from": [0],
  "condition": {
    "and": [
      { "kernel": "moore",        "value": [1], "sign": "=", "count": 3 },
      { "kernel": "vonNeumann",   "value": [1], "sign": "<", "count": 2 }
    ]
  },
  "to": 2
}
```

This cell becomes type 2 only if both neighborhood tests are satisfied.

### 6.2 Multi-Phase Pipelines

To stage your automaton in phases, chain rules that write intermediate markers then finalize:

```json
"behavior": [
  { "from": [0], "condition": { /* phase 1 */ }, "to": 9 },
  { "from": [9], "condition": { /* phase 2 */ }, "to": 3 },
  { "from": [9], "elseTo": 0 }
]
```

Cells pass from 0→9→3 or 0→9→0 across two phases in a single tick.

---

## 7. Advanced Features & Tips

- **Coordinate-Dependent Kernels**  
  Use formulas inside kernel weights or counts:  
  `"kernel": [[ "1+sin(x+y)", 0, 1 ]]`  

- **Dynamic Rule Sets**  
  Load different JSON sets at runtime for evolving automata.  

- **Debugging Tools**  
  Insert temporary rules that color-code states (e.g., `to: "row"` maps cell value to its row index).  

- **Performance**  
  - Precompile formulas by loading JSON once.  
  - Reuse named kernels instead of inline matrices.  
  - Flatten grid into typed arrays for large simulations.

- **Layered CAs**  
  Run multiple Life instances side by side, passing one’s output as another’s input for reaction–diffusion systems.

---

## 8. Validation Checklist

- Every rule has non-empty `from` and a `to`.  
- `sign` fields are one of `=, !=, <, <=, >, >=`.  
- Kernel names exist in `kernels` or are valid inline matrices.  
- Formula strings compile without syntax errors.  
- No conflicting multi-phase rules unless intentional.

---

With this specification, you can craft rule sets as simple or surreal as you imagine—from classic Conway Life to multi-state, multi-kernel, coordinate-driven universes. What emergent pattern will you discover next?