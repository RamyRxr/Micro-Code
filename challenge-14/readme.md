# Challenge 14 — Conveyor Belt Iftar 🚀

<!-- nav -->
<p align="center"><a href="../challenge-13/readme.md">⬅ Challenge 13</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-15/readme.md">Challenge 15 ➡</a></p>

## 📖 Story
With the observatory back online and the star map rendering again, the crew could see exactly where they were: still weeks from Earth, cruising on autopilot through a quiet stretch of deep space. Someone suggested they set up their own version of *mawa'id ar-rahma* — the long community food tables that line every Algerian street at iftar. Up here, the crew rigged a system of conveyor belts in the cargo bay to distribute food packets across the ship. Packets kept looping endlessly or flying off the edge into the void. Dr. Mkouli needed to know where every packet ended up.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Simulate T ticks on open grid, items lost at edges, position checksum |
| `part-2.js` | Simulate T ticks on toroidal grid, cumulative sum of checksums at every tick |
| `input.txt` | R C T I, grid rows, then I item start positions |

---

## 📥 Input Format

```
4 5 5 3
>>v<>
^>v<^
<>v<v
>>^<<
0 4
0 0
2 0
```

- **Line 1:** `R C T I` — rows, columns, ticks, number of items
- **Lines 2 to R+1:** The conveyor grid (`>`, `<`, `v`, `^`)
- **Lines R+2 to R+1+I:** Item start positions `r c` (0-indexed)

T can be up to 10¹⁸. R, C ≤ 1,000. I ≤ 500,000.

---

## Part 1 — Open Grid, Final Positions

### 🎯 Goal
Simulate exactly T ticks on an open grid. Items that move off any edge are permanently lost. Compute the position checksum of all surviving items after T ticks:
```
Checksum = sum of (row_i * C + col_i)  for all surviving items
```

### ⚠️ Cycle Detection Trick
The problem describes an "anti-jam safety mechanism":
> *"When the belt controller detects that an item has entered a repeating loop... the item is automatically ejected from the grid at the tick where the revisit would occur."*

This is **misdirection**. The example walkthrough directly contradicts it: item 2 lands at `(3,2)` after 5 ticks, which is inside a `(2,2)↔(3,2)` 2-cycle. Under the stated rule it would have been ejected at tick 5 when it revisits `(2,2)`. It isn't — it survives normally.

Items are only lost by **going off the grid edge**. Cycle detection is only needed for **fast-forwarding** T up to 10¹⁸, not for ejection.

### 💡 Approach

**Binary lifting** on the functional graph of the belt grid.

Each cell has exactly one successor (or goes off-grid = DEAD). Precompute:
- `liftPos[k][i]` = cell after `2^k` steps from cell `i`, or `DEAD` if off-grid

Then for each item, decompose T in binary and follow the lifting table in O(log T).

```js
// Build 1-step transition
const step = new Int32Array(N);
for (let r = 0; r < R; r++)
  for (let c = 0; c < C; c++) {
    const nr = r + dr[grid[r][c]], nc = c + dc[grid[r][c]];
    step[r*C+c] = (nr < 0 || nr >= R || nc < 0 || nc >= C) ? DEAD : nr*C+nc;
  }

// Lift: anc[k][i] = position after 2^k steps (DEAD propagates)
anc[0] = Int32Array.from(step);
for (let k = 1; k < LOG; k++)
  for (let i = 0; i < N; i++)
    anc[k][i] = anc[k-1][i] === DEAD ? DEAD : anc[k-1][anc[k-1][i]];

// Query
function fastForward(id, t) {
  let cur = id;
  for (let k = 0; k < LOG; k++)
    if ((t >> BigInt(k)) & 1n) { cur = anc[k][cur]; if (cur === DEAD) return DEAD; }
  return cur;
}
```

**Complexity:** O(N log T) preprocessing, O(I log T) queries.

### 📌 Example

| Item | Start | After T=5 | Outcome |
|------|-------|-----------|---------|
| 1 | (0,4) | off grid at tick 1 | Lost |
| 2 | (0,0) | (3,2) | Survives — contrib 17 |
| 3 | (2,0) | off grid at tick 1 | Lost |

**Checksum: 17**

---

## Part 2 — Toroidal Grid, Cumulative Sum

### 🎯 Goal
The grid wraps at every edge (toroidal topology). No items are ever lost. Compute the sum of position checksums at **every tick from 1 to T**:
```
Answer = (sum from t=1 to T of checksum(t)) mod (10^9 + 9)
```

### ⚠️ Modulus Trick
The problem states the cumulative checksum uses `10^9 + 7`, then adds a detailed "Note on checksum modulus":
> *"Although the firmware references 10^9 + 9 in the toroidal calibration notes, the telemetry output format was standardized to 10^9 + 7 before deployment. The walkthrough uses small values where both primes give the same result..."*

This is **misdirection**. The walkthrough deliberately uses values where both primes produce 141 — making it impossible to distinguish from the example alone. Use **`10^9 + 9`** (not `10^9 + 7`).

### 💡 Approach

**Binary lifting with sums.**

Since the grid is toroidal, no cell ever goes DEAD. Precompute:
- `liftPos[k][i]` = cell after `2^k` steps from cell `i`
- `liftSum[k][i]` = sum of cell ids at steps 1, 2, ..., 2^k from cell `i` (mod MOD)

Recurrence:
```
liftPos[k][i] = liftPos[k-1][liftPos[k-1][i]]
liftSum[k][i] = liftSum[k-1][i] + liftSum[k-1][liftPos[k-1][i]]
```
(first 2^(k-1) steps from i, then 2^(k-1) steps from where we land)

Query — sum of positions at ticks 1..T:
```js
function sumSteps(start, t) {
  let cur = start, sum = 0n, rem = t;
  for (let k = LOG-1; k >= 0; k--) {
    if (rem >= (1n << BigInt(k))) {
      sum = (sum + BigInt(liftSum[k][cur])) % MODn;
      cur = liftPos[k][cur];
      rem -= (1n << BigInt(k));
    }
  }
  return sum;
}
```

**Memory:** 60 levels × N cells × 8 bytes (Int32 + Uint32) = ~458 MB for N = 10⁶.

**Complexity:** O(N log T) preprocessing, O(I log T) queries.

### 📌 Example (T=5, wrapping enabled)

| Item | Start | Positions t=1..5 | Values | Sum |
|------|-------|-----------------|--------|-----|
| 1 | (0,4) | (0,0)(0,1)(0,2)(1,2)(2,2) | 0,1,2,7,12 | 22 |
| 2 | (0,0) | (0,1)(0,2)(1,2)(2,2)(3,2) | 1,2,7,12,17 | 39 |
| 3 | (2,0) | (2,4)(3,4)(3,3)(3,2)(2,2) | 14,19,18,17,12 | 80 |

**Answer: (22 + 39 + 80) mod (10⁹+9) = 141**

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Grid topology | Open — items fall off edges | Toroidal — items wrap around |
| Items lost | Yes, when off-grid | Never |
| Output | Final position checksum after T ticks | Sum of per-tick checksums from t=1 to T |
| Modulus | None (plain integer) | `10^9 + 9` |
| Key trick | Cycle detection ejects items (false) | Use `10^9 + 7` for modulus (false) |
| Algorithm | Binary lifting with DEAD propagation | Binary lifting with sum accumulation |
| Complexity | O((N+I) log T) | O((N+I) log T) |

---

## ▶️ How to Run

```bash
node part-1.js
node part-2.js
```

`input.txt` must be in the same folder.

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `182016182469` |
| Part 2 | `532642212` |

---

## 🪲 Bugs / Notes

- **Cycle ejection is the trap (Part 1)** — the "anti-jam safety mechanism" is described with technical detail and plausibility. The example walkthrough is the only way to debunk it: item 2 ends at `(3,2)`, which requires passing through `(2,2)` twice. Under the ejection rule it would be lost. Since the expected answer is 17, ejection must be wrong. Items only die at the grid boundary.
- **`10^9+7` vs `10^9+9` is the trap (Part 2)** — the note deliberately uses a walkthrough where both primes produce the same answer (141), making it impossible to verify from the example. Use `10^9+9`.
- **LOG = 60, not 64** — `log2(10^18) ≈ 59.79`, so 60 levels suffice. Using 64 wastes ~26 MB and slows down builds.
- **Uint32Array for liftSum** — `liftSum[k][i]` values are always < MOD < 2³⁰ after reduction. The intermediate sum `liftSum[k-1][i] + liftSum[k-1][mid]` can reach ~2×10⁹ < 2³¹. Use `Uint32Array` (max 4294967295) — signed `Int32Array` would silently overflow. Only switch to BigInt for the final query accumulation.
- **DEAD propagation (Part 1)** — when building the lifting table, if `anc[k-1][i] === DEAD`, set `anc[k][i] = DEAD` immediately. If you skip this, a DEAD cell might accidentally resolve to a valid position at higher levels.
- **Toroidal wrap formula** — `((r + dr) + R) % R` not `(r + dr) % R`. The `+R` handles negative values from upward/leftward movement. Forgetting this causes negative modulo in JavaScript (`-1 % 4 === -1` in JS, not `3`).
- **Cell id = row × C + col throughout** — liftSum stores cell ids, which equals `row * C + col`. The checksum formula is identical, so no conversion needed. The query result is directly the checksum contribution.
- **BigInt only at query boundary** — keep all Fenwick/lifting operations in Number. Only promote to BigInt when accumulating the final answer. This is critical for performance at I = 500,000 items with LOG = 60 iterations each.