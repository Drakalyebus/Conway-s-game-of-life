# JSON Rule Definition for the Life Engine

---

## 1. Top-Level Schema

Each ruleset is a JSON object with four primary keys:

| Key        | Type     | Required | Description                                           |
|------------|----------|----------|-------------------------------------------------------|
| `types`    | array    | no       | *(Optional)* Initial cell values or formula strings.  |
| `kernels`  | object   | no       | Named neighbor-weight matrices.                       |
| `default`  | object   | no       | Fallback settings (e.g. default kernel).              |
| `behavior` | array    | yes      | Ordered list of state-transition rules.               |

A valid ruleset **must** include `behavior`. Omitted keys are inferred from rules and built-ins.

---

## 2. Cell Types (`types`)

Defines the universe of possible cell values at initialization and for randomization.

- **Optional**: If absent, `Life.types()` infers values from your rules.  
- Entries may be:
  - Numeric literals, e.g. `0`, `1.5`, `-2`.  
  - Formula strings that reference **only**:
    - `globalRandom` (uniform ∈ [0,1) per tick)  
    - Built-in constants and functions  

**Disallowed in `types`**: `x`, `y`, `row`, `column`  
These are undefined at type-definition time and compile to `NaN`.

```jsonc
// Valid
"types": [
  0,
  1,
  "globalRandom < 0.1 ? 2 : 1",
  "random(0,4) | 0"
]

// Invalid (→ NaN)
"types": [
  "x % 3",
  "row - column"
]
```

---

## 3. Mathematical Expressions

Most numeric fields in **behavior** and **kernels** accept JavaScript-style formulas.

### 3.1 Available Variables

- **In behavior** (`condition`, `to`, `elseTo`):
  - `x`, `y`        → column, row of the **current** cell  
  - `globalRandom` → tick-wide random number  

- **In kernels** (each matrix entry):
  - `row`, `column` → relative offset within the kernel (negative above/left, zero at center)  
  - `x`, `y`, `globalRandom` as above  

### 3.2 Operators & Precedence

1. Parentheses & function calls  
2. Exponentiation: `^` (internally `**`)  
3. Multiplicative: `*`, `/`, `%`  
4. Additive: `+`, `-`  
5. Comparison: `<`, `>`, `<=`, `>=`, `=`, `!=`  
6. Logical NOT: `!`  
7. Logical AND: `&`  
8. Logical OR: `|`  
9. Ternary: `condition ? exprA : exprB`

### 3.3 Implicit Multiplication

The compiler inserts `*` between specific adjacent token pairs:

- Number ↔ variable/function: `2x` → `2 * x`  
- Number ↔ `(`: `2(x+1)` → `2 * (x+1)`  
- `)` ↔ Number/Variable/Function: `(x+1)2` → `(x+1) * 2`  
- Variable ↔ `(` or Variable ↔ Variable if separated by space:  
  - `"x y"` → `x * y`  
  - `"x sin(y)"` → `x * sin(y)`

#### 3.3.1 Limitations

- **`xsin(y)`** without space is treated as identifier `xsin` → `NaN`.  
- **`xy`** without space is treated as identifier `xy` → `NaN`.

**Always include a space** when you intend multiplication:

```js
// Supported
"x sin(y)"   // → x * sin(y)
"x y"        // → x * y

// Not supported
"xsin(y)"    // → NaN
"xy"         // → NaN
```

### 3.4 Built-In Functions & Constants

| Category       | Examples                                     |
|----------------|----------------------------------------------|
| Trigonometry   | `sin(x)`, `cos(y)`, `tan(z)`, `sinc(x)`      |
| Hyperbolic     | `sinh(x)`, `cosh(y)`, `tanh(z)`              |
| Exponents      | `exp(x)`, `log(x)`, `ln(x)`, `sqrt(x)`       |
| Utilities      | `abs(x)`, `floor(x)`, `ceil(x)`, `round(x)`, `clamp(x,a,b)` |
| Randomness     | `random(min,max)`                            |
| Constants      | `pi`, `e`, `tau`, `phi`, `epsilon`, `infinity`, `nan` |
| Number Theory  | `mod(x,y)`, `gcd(x,y)`, `lcm(x,y)`            |
| Factorials     | `factorial(n)`                               |
| Conversions    | `rad(deg)`, `deg(rad)`                       |
| Logistic       | `sigmoid(x)`, `logit(p)`                     |

> **sinc(x)** returns `sin(x)/x` for `x≠0`, and `1` at `x=0` to avoid division by zero.

---

## 4. Neighborhood Kernels (`kernels`)

Named matrices that weight neighbor contributions:

```json
"kernels": {
  "moore":   [[1,1,1],[1,0,1],[1,1,1]],
  "diamond": [[0,1,0],[1,0,1],[0,1,0]],
  "radial": [
    ["1/(1+row*row+column*column)", "…", "…"],
    ["…",                         "0", "…"],
    ["…",                         "…", "…"]
  ]
}
```

- Auto-padded to odd dimensions.  
- Entries may be literals or formulas using `row`, `column`, `x`, `y`, `globalRandom`.  
- In rules, refer by name or supply an inline 2D array.

---

## 5. Toroidal Wrapping

Neighbor coordinates wrap on both axes:

```
nx = (x + dx + width)  % width  
ny = (y + dy + height) % height
```

Always enabled—no JSON toggle.

---

## 6. Default Settings (`default`)

Fallbacks when rules omit parameters:

```json
"default": {
  "kernel": "moore"
}
```

- `default.kernel` applies if a rule’s `condition` lacks `kernel`.

---

## 7. Behavior Rules (`behavior`)

An array of rule objects, each with:

```json
{
  "priority": integer,          // higher runs first (default 0)
  "from":     [types/formulas], // only cells matching these values are tested
  "condition": { … },           // optional predicate
  "to":       literal/formula,  // new value if predicate true
  "elseTo":   literal/formula   // new value if false (defaults to original)
}
```

Sorted by descending `priority`, then by array order. The first matching rule **wins** per cell.

### 7.1 `from`

Array of literals or formulas. Only cells whose compiled current value equals one entry are considered.

### 7.2 `condition`

Defines when `to` applies. Three modes:

1. **Neighbor Count Test**  
2. **Expression Test**  
3. **Logical Composition** using single-character:

   - `&` → AND  
   - `|` → OR  
   - `!` → NOT  

#### 7.2.1 Neighbor Count Test

```json
{
  "value":  [1, "2*y"],
  "kernel": "moore",
  "sign":   ">=",
  "count":  "3 + (x % 2)"
}
```

Engine compiles neighbor values and kernel weights, sums contributions of matching neighbors, and compares to `count`.

#### 7.2.2 Expression Test

```json
{
  "expression": "x*y + globalRandom",
  "sign":       "<",
  "value":      "5"
}
```

Evaluates at `{x,y,globalRandom}` and compares to `value`.

#### 7.2.3 Logical Composition

Combine subtests:

```json
{
  "and": [ /* both must pass */ ],
  "or":  [ /* at least one */ ],
  "not": { /* negates child */ }
}
```

Internally uses single-character `&`/`|` semantics.

### 7.3 `to` & `elseTo`

- `to`: assigned if `condition` **true**  
- `elseTo`: assigned if **false** (defaults to original)  

Formulas use `{x,y,globalRandom}`; `row`/`column` only in kernels.

---

## 8. Multi-Kernel Conditions

Test multiple kernels in one rule:

```json
{
  "from":[1],
  "condition":{
    "and":[
      { "kernel":"moore",   "value":[1], "sign":"=", "count":3 },
      { "kernel":"diamond", "value":[2], "sign":">", "count":1 }
    ]
  },
  "to":2
}
```

---

## 9. Multi-Phase Pipelines

Chain intermediate states in one tick:

```json
"behavior":[
  { "from":[0], "condition":{/*phase1*/}, "to":9 },
  { "from":[9], "condition":{/*phase2*/}, "to":3 },
  { "from":[9],               "elseTo":0 }
]
```

Cells follow `0 → 9 → 3` or `0 → 9 → 0` per update.

---

## 10. Randomness & Determinism

- `globalRandom` is sampled **once per tick**, shared across all formulas.  
- For repeatable runs, inject a seeded RNG into `compile` instead of `Math.random()`.

---

## 11. Dynamic Type Discovery

`types()` aggregates from:

- Top-level `types` (if provided)  
- Results of all `from`, `to`, `elseTo` formulas  
- Values referenced in neighbor-count tests and kernels  

Populates `Life.defined` for randomization and UI.

---

## 12. Best Practices

- Always supply non-empty `from` and a `to` in each rule.  
- Verify that kernel names exist in `kernels`.  
- Confirm `sign` ∈ `=`, `!=`, `<`, `<=`, `>`, `>=`.  
- Keep logical nests shallow for performance.  
- Cache compiled formulas per tick to avoid repeated `new Function(...)`.  
- Test intricate expressions in a REPL before embedding.  
- Use explicit spaces for implicit multiplication with variables/functions:
  - `"x sin(y)"` instead of `"xsin(y)"`
  - `"x y"` instead of `"xy"`

---

## 13. Complete Advanced Example

```json
{
  "types":[0,1,2,"globalRandom<0.05?3:1"],
  "kernels":{
    "moore":   [[1,1,1],[1,0,1],[1,1,1]],
    "gaussian":[[0.05,0.1,0.05],[0.1,0,0.1],[0.05,0.1,0.05]]
  },
  "default":{"kernel":"moore"},
  "behavior":[
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
      "to":"sinc(x*y) > 0.5 ? 1 : 0"
    }
  ]
}
```