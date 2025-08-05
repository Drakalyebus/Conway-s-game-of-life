# JSON Rule Definition for the Life Engine

This is a deep-dive guide to authoring JSON rule sets for the Life class. You’ll learn every nuance—from writing formulaic cell values and complex conditions, to defining multi-kernel neighborhoods, toroidal wrapping, multi-phase pipelines, randomness, and more.

---

## 1. Top-Level Schema

Every rule file is a JSON object with four main properties:

```json
{
  "types":   [ /* cell values/formulas */ ],
  "kernels": { /* named weight matrices */ },
  "default": { /* fallback settings */ },
  "behavior":[ /* ordered list of transition rules */ ]
}
```

- `types` (array, required)  
  All possible cell values, either as numeric literals or formula strings.
- `kernels` (object, optional)  
  Named matrices of neighbor-weight tiles.
- `default` (object, optional)  
  Fallback settings (e.g. default kernel name).
- `behavior` (array, required)  
  One or more rule objects evaluated each tick.

---

## 2. Cell Types (`types`)

Defines the universe of legal cell values:

- **Numeric literals**: `0`, `1`, `2.718`, `-3`
- **Formula strings**: `"x%3"`, `"globalRandom<0.2?2:1"`

During initialization and in `types()` discovery, each entry is compiled once per tick:

```json
"types": [
  0,
  1,
  "x % 4",
  "globalRandom < 0.1 ? 2 : 3"
]
```

---

## 3. Mathematical Expressions

Any field expecting a number may instead be a JavaScript-style formula string.  

### 3.1 Variables

- `x`, `y`        → grid coordinates (column, row)  
- `row`, `column` → relative kernel offsets  
- `globalRandom`  → uniform random ∈ [0,1) for the current tick  

### 3.2 Operators & Precedence

1. Function calls & parentheses  
2. Exponentiation: `^` (internally `**`)  
3. Multiplicative: `*`, `/`, `%`  
4. Additive: `+`, `-`  
5. Comparison: `<`, `>`, `<=`, `>=`, `=`, `!=`  
6. Logical NOT: `!`  
7. Logical AND: `&&`  
8. Logical OR: `||`  
9. Ternary: `condition ? exprA : exprB`  

### 3.3 Implicit Multiplication

Supported between:

- Number ↔ variable/function: `2x` → `2*x`
- Parenthesis adjacency: `2(x+1)` → `2*(x+1)`
- Function call adjacency: `xsin(y)` → `x * sin(y)`

### 3.4 Built-In Functions & Constants

| Name      | Example               | Description                             |
|-----------|-----------------------|-----------------------------------------|
| `sin`, `cos`, `tan`  
| `asin`, `acos`, `atan`       | `sin(x+y)`              | Trig functions                          |
| `sinh`, `cosh`, `tanh`       | `tanh(x)`               | Hyperbolic functions                    |
| `exp`, `log`, `ln`           | `exp(x)`                | Exponential & logarithms                |
| `sqrt`, `cbrt`               | `sqrt(x)`               | Roots                                   |
| `abs`, `floor`, `ceil`, `round`  
| `min`, `max`, `clamp`        | `clamp(x,0,1)`          | Utilities                               |
| `factorial`                  | `factorial(5)`          | Integer factorial                       |
| `random(min, max)`           | `random(0,10)`          | Uniform random [min, max)               |
| `pi`, `e`, `tau`, `phi`      | `pi`, `tau`             | Mathematical constants                  |
| `mod(x,y)`                   | `mod(7,3)`              | Modulo                                  |
| `gcd(x,y)`, `lcm(x,y)`       | `gcd(8,12)`             | Number theory helpers                   |
| `rad(x)`, `deg(x)`           | `rad(90)`               | Angle conversions                       |
| `sigmoid`, `logit`           | `sigmoid(2)`            | Logistic functions                      |

---

## 4. Neighborhood Kernels (`kernels`)

Define how neighbor contributions are weighted.

```json
"kernels": {
  "moore": [
    [1,1,1],
    [1,0,1],
    [1,1,1]
  ],
  "diamond": [
    [0,1,0],
    [1,0,1],
    [0,1,0]
  ]
}
```

- Each kernel is a 2D array of non-negative weights.
- The engine pads to odd dimensions automatically.
- **Inline kernels** may also be used directly in a rule’s condition in place of a name.

---

## 5. Toroidal Wrapping

Coordinates wrap on both axes:

```
nx = (x + dx + width)  % width
ny = (y + dy + height) % height
```

You need not declare wrapping—it’s always on.

---

## 6. Default Settings (`default`)

Fallbacks for rules that don’t explicitly specify:

```json
"default": {
  "kernel": "moore"
}
```

- `default.kernel` → name of the kernel used if a rule omits its own.

---

## 7. Behavior Rules (`behavior`)

An array of rule objects. Each rule is:

```json
{
  "priority":  integer,            // higher → evaluated first (default 0)
  "from":      [types/formulas],   // only apply if current value ∈ from
  "condition": { … },              // optional predicate
  "to":        literal/formula,    // assigned if predicate is true
  "elseTo":    literal/formula     // assigned if predicate is false (defaults to original)
}
```

Rules are sorted descending by `priority` and then by order in the array. The first matching rule “wins.”

---

### 7.1 The `from` Field

- Array of numeric literals or formulas.
- A rule only considers cells whose **compiled** current value equals one of these.

---

### 7.2 The `condition` Object

Three modes of test:

1. **Neighbor Count Test**  
2. **Expression Test**  
3. **Logical Composition**

#### 7.2.1 Neighbor Count Test

```json
{
  "value":   [1, "2*y"],  // types to count
  "kernel":  "moore",     // or inline 2D array
  "sign":    ">=",        // =, !=, <, <=, >, >=
  "count":   "3 + (x%2)"  // target
}
```

Engine computes, for each neighbor cell whose compiled value ∈ `value`, the sum of the corresponding kernel weight (compiled) and compares to `count`.

#### 7.2.2 Expression Test

```json
{
  "expression": "x*y + globalRandom",
  "sign":       "<",
  "value":      "5"
}
```

- Evaluates `expression` at the cell; compares to `value`.

#### 7.2.3 Logical Combinators

Nest tests via

- **`and`**: all must be true  
- **`or`**: at least one true  
- **`not`**: negates its child  

```json
{
  "and": [
    { /* neighbor test */ },
    { "not": { /* expression test */ } }
  ]
}
```

---

### 7.3 The `to` & `elseTo` Fields

- `to`: value/formula if test passes  
- `elseTo`: value/formula if test fails (defaults to original cell value)  

All formulas here re-use the same variable context (`x,y,row,column,globalRandom`).

---

## 8. Multi-Kernel Conditions

Combine counts from different kernels in one rule:

```json
{
  "from": [1],
  "condition": {
    "and": [
      { "kernel":"moore",   "value":[1], "sign":"=", "count":3 },
      { "kernel":"diamond", "value":[2], "sign":">", "count":1 }
    ]
  },
  "to": 2
}
```

---

## 9. Multi-Phase Pipelines

Stage a cell through intermediate states in one tick:

```json
"behavior": [
  { "from":[0], "condition":{/*phase1*/}, "to":9 },
  { "from":[9], "condition":{/*phase2*/}, "to":3 },
  { "from":[9],               "elseTo":0 }
]
```

Sequence: `0→9→3` or `0→9→0` per tick.

---

## 10. Randomness & Determinism

- `globalRandom` is sampled **once per tick** and shared by all formulas.  
- For reproducible runs, seed your own RNG and inject into `compile` calls instead of `Math.random()`.

---

## 11. Dynamic Type Discovery

The `types()` method collects:

- All literal/formula types  
- `from`, `to`, and `elseTo` results  
- Values used in every condition  

This populates `Life.defined` for randomization and UI listings.

---

## 12. Best Practices

- Always include non-empty `from` and a `to` field.  
- Verify named kernels in `kernels`.  
- Keep deeply nested logical trees shallow for performance.  
- Cache compiled formulas per tick to avoid repeat `new Function(...)` calls.  
- Test intricate expressions in REPL before embedding.  
- Use descriptive intermediate states (e.g., `9` above) for multi-phase clarity.

---

## 13. Full Advanced Example

```json
{
  "types": [0, 1, 2, "globalRandom<0.05?3:1"],
  "kernels": {
    "moore":   [[1,1,1],[1,0,1],[1,1,1]],
    "gaussian":[[.05,.1,.05],[.1,0,.1],[.05,.1,.05]]
  },
  "default": {"kernel":"moore"},
  "behavior": [
    {
      "priority":2,
      "from":[0],
      "condition":{
        "expression":"sin(x+y)+globalRandom",
        "sign":">",
        "value":1.2
      },
      "to":2
    },
    {
      "priority":1,
      "from":[2],
      "condition":{
        "value":[1],
        "kernel":"gaussian",
        "sign":">=",
        "count":2
      },
      "to":3,
      "elseTo":0
    },
    {
      "from":[1,3],
      "condition":{
        "or":[
          {"value":[2], "sign":">", "count":3},
          {"not":{
             "value":[3], "sign":"<", "count":1
           }}
        ]
      },
      "to":"globalRandom<0.5?1:0"
    }
  ]
}
```

With this schema, you can craft worlds of emergent complexity, blending math, randomness, and multi-kernel interactions. Let your imagination run free!