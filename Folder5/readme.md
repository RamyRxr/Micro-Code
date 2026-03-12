# Challenge 05 — Dead Star Calibration 🌑

## 📖 Story
While the crew was perfecting the iftar schedule, nobody was watching the navigation console. The ship has drifted into the gravity well of a dead star. The only way to fire the thruster override is to recalibrate the navigation array — but the console is flooded with thousands of garbled transmissions from the star's dying days. Adel must filter out the noise, extract stable signals, and compute two calibration values to pull the ship back on course.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Parse transmissions, build bit sequence, compute Power Index |
| `part2.js` | Same pipeline + mutation window + period detection → Entropy Score |
| `input.txt` | 2000–2500 lines of transmission data |

---

## 📥 Input Format

Each non-blank line follows the pattern (arbitrary whitespace around delimiters):

```
  42 | A : A
 -17 | B : C
  00007 | D : D
  0 | E : E
  3  |  F :  F
```

- **VALUE** — signed integer, possibly with leading zeros
- **MODE_S** — send channel (single uppercase letter)
- **MODE_R** — receive channel (single uppercase letter)
- Blank lines are pure noise — ignore them

---

## 🔍 Shared Pipeline (Both Parts)

### Step 1 — Filter Stable Signals
A transmission is stable only when `MODE_S == MODE_R`. Discard everything else and all blank lines. Count the stable signals as `S`.

```
42 (A=A ✓), -17 (B≠C ✗), 7 (D=D ✓), 0 (E=E ✓), 3 (F=F ✓) → S = 4
```

Regex used to parse each line:
```js
line.match(/^\s*(-?\d+)\s*\|\s*([A-Z])\s*:\s*([A-Z])\s*$/)
```

### Step 2 — Build Bit Sequence
From stable signals, take `|value|`. Discard zeros. For the rest:
- Prime → bit `1`
- Not prime → bit `0`

```
|42|=42 (not prime → 0), |7|=7 (prime → 1), |0| discarded, |3|=3 (prime → 1)
bits = [0, 1, 1],  N = 3
```

---

## Part 1 — Power Index

### 🎯 Goal
Use the bit sequence and stable count `S` to compute a Power Index for thruster calibration.

### 📌 Example

```
S=4, shift = 4 mod 7 = 4, N=3, bits=[0,1,1]
```

| i | E = ((i+shift-1) mod N)+1 | Bit | Operation | Power |
|---|--------------------------|-----|-----------|-------|
| 1 | ((1+4-1) mod 3)+1 = 2 | 0 | −gcd(2,3) = −1 | −1 |
| 2 | ((2+4-1) mod 3)+1 = 3 | 1 | +3×3 = +9 | 8 |
| 3 | ((3+4-1) mod 3)+1 = 1 | 1 | +1×1 = +1 | 9 |

**Output:** `9`

### 💡 Approach

```js
const shift = S % 7;
let power = 0;

for (let i = 1; i <= N; i++) {
  const E = ((i + shift - 1) % N) + 1;
  if (bits[i - 1] === 1) power += E * E;
  else                   power -= gcd(E, N);
}
```

**`gcd`** — standard Euclidean: `gcd(a, b) = b === 0 ? a : gcd(b, a % b)`

**Complexity:** O(n log n) — dominated by primality checks.

---

## Part 2 — Entropy Score

### 🎯 Goal
Run the bit sequence through a 5-bit sliding window mutation filter, find the smallest repeating period, and compute the Entropy Score.

### Step 3 — Sliding Window Mutation

Slide a window of 5 consecutive bits across the bit sequence. For each window starting at position `i` (0 to N−5), pack the bits into `W`:

```
W = B[i]×16 + B[i+1]×8 + B[i+2]×4 + B[i+3]×2 + B[i+4]
```

Then emit one bit using these rules **in order** (first match wins):

| Condition | Emit |
|-----------|------|
| `W % 3 === 0` | `1` |
| `W % 5 === 0` | `0` |
| otherwise | `(sum of 5 bits) mod 2` (parity) |

Produces a mutated sequence `M` of length `N − 4`.

### Step 4 — Find Smallest Period L

Find the smallest `L` that divides `len(M)` and satisfies `M[i] === M[i mod L]` for every `i`.

```js
for (let L = 1; L <= ML; L++) {
  if (ML % L === 0 && isPeriod(L)) { break; }
}
```

Only divisors of `ML` are valid — the pattern must tile the sequence perfectly with no remainder.

### Step 5 — Entropy Score

```
posSum = sum of (i + 1) for every index i where M[i] = 1
Entropy = posSum × L
```

### 📌 Example

Mutated sequence `[1, 0, 1, 0, 1, 0]`:
- Pattern `[1, 0]` repeats perfectly → `L = 2`
- Ones at indices 0, 2, 4 → posSum = 1 + 3 + 5 = 9
- **Entropy = 9 × 2 = 18**

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Input pipeline | Parse → filter → bits | Same |
| Core computation | Rotating index + E² / gcd | Sliding window mutation |
| Output | Power Index | Entropy Score = posSum × L |
| Extra steps | — | Period detection |

---

## ▶️ How to Run

```bash
node part1.js
node part2.js
```

`input.txt` must be in the same folder as the scripts.

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `62098239` |
| Part 2 | `1135883552` |

---

## 🪲 Bugs / Notes

- **Leading zeros in VALUE** — `parseInt(val, 10)` handles them correctly (`00007` → `7`). Never use `parseInt` without the radix `10` — octal parsing would silently corrupt values starting with `0`.
- **Blank lines** — always check `line.trim()` before running the regex, otherwise the regex match throws on empty strings.
- **Period must divide length** — only test `L` values where `ML % L === 0`. Testing every integer up to `ML` wastes time and can produce a wrong `L` that doesn't tile evenly.
- **Window too short** — if `N < 5`, the mutation produces an empty sequence. The period of an empty sequence is technically 1 and posSum is 0, so Entropy = 0.
