# Challenge 13 — Star Map Renderer 🌌

<!-- nav -->
<p align="center"><a href="../challenge-12/readme.md">⬅ Challenge 12</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-14/readme.md">Challenge 14 ➡</a></p>

## 📖 Story
With the ship's memory clean and Ramadan settled into rhythm, Adel drifted to the observation deck to watch the constellations shift. The panoramic viewport screens were dark — a burst of cosmic radiation had hit the observatory's rendering board during the memory cleanup, and the 3D star map firmware was producing nothing. The firmware's operation log was intact: thousands of entries, each defining a cuboid region of space and applying a transformation to place it into the rendered map. Adel needed to recompute the total energy and verify which star points were still active before the crew could navigate the final stretch home.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Sum of energy over all transformed points (duplicates counted per operation) |
| `part-2.js` | Sum of unique-point energies after each modification query |
| `input.txt` | M, M operation lines, Q, Q query lines |

---

## 📥 Input Format

```
3
0 0..1,0..1,0..0
1 0..1,0..0,0..1
2 1..2,0..0,3..3
2
D 1
R 2 0..0,0..0,0..0
```

- **Line 1:** `M` — number of operations
- **Lines 2 to M+1:** `MODE x1..x2,y1..y2,z1..z2`
- **Line M+2:** `Q` — number of modification queries
- **Lines M+3 to M+2+Q:** `D <idx>` or `R <idx> <ranges>`

Coordinates are integers in `[0, 999999]`. Ranges are always interpreted as `[min(a,b), max(a,b)]`.

---

## Transformations

| MODE | Name | Formula |
|------|------|---------|
| 0 | Rotate 90° CCW around Z | `(x,y,z) → (−y, x, z)` |
| 1 | Scale ×2 from origin | `(x,y,z) → (2x, 2y, 2z)` |
| 2 | Swap X and Z axes | `(x,y,z) → (z, y, x)` |

Each operation generates all integer lattice points in its cuboid, applies the transformation, and adds the resulting points to the output set. Operations are **independent** — they do not chain.

**Output-space structure after transformation:**
- **Mode 0:** output x = −y ≤ 0, output y = x ≥ 0, output z ≥ 0 → box lives in x ≤ 0 half-space
- **Mode 1:** output coords are all even, all ≥ 0 → sparse even-grid box
- **Mode 2:** output x = z ≥ 0, output y ≥ 0, output z = x ≥ 0 → box lives in x ≥ 0 half-space

---

## Part 1 — Total Energy (with duplicates)

### 🎯 Goal
Sum `x² + y² + z²` over **all** transformed points from all operations. Points produced by multiple operations are counted multiple times. Output modulo `10^9 + 9`.

### ⚠️ Modulus Trick
The problem includes a long "Clarification" paragraph explaining why `10^9 + 7` is the correct modulus, calling `10^9 + 9` a "well-documented calibration error." The output format line and the example walkthrough both say `10^9 + 9`. Use **`10^9 + 9`**.

### 💡 Key Insight: All modes produce the same quadratic form

**Mode 0** `(−y, x, z)`: energy = `(−y)² + x² + z² = y² + x² + z²` — identical to original.

**Mode 2** `(z, y, x)`: energy = `z² + y² + x²` — identical to original.

**Mode 1** `(2x, 2y, 2z)`: energy = `4x² + 4y² + 4z²` — scaled by 4.

So for each operation, the energy sum reduces to a closed form using `Σi²`:

```js
function opEnergy(mode, x1, x2, y1, y2, z1, z2) {
  const Nx = BigInt(x2-x1+1) % MOD, Ny = ..., Nz = ...;
  const Sx = sumSq(x1,x2), Sy = sumSq(y1,y2), Sz = sumSq(z1,z2);
  const base = (Sx*Ny%MOD*Nz + Sy*Nx%MOD*Nz + Sz*Nx%MOD*Ny) % MOD;
  return mode === 1 ? 4n * base % MOD : base;
}
```

where `sumSq(a,b) = b(b+1)(2b+1)/6 − (a−1)a(2a−1)/6` using modular inverse of 6.

**Complexity:** O(M) — one O(1) formula per operation.

### 📌 Example

| Op | Mode | Contribution |
|----|------|-------------|
| 0 | Rotate | 4 |
| 1 | Scale ×2 | 16 |
| 2 | Swap | 23 |

**TotalEnergy: 43**

---

## Part 2 — Unique-Point Energy After Each Query

### 🎯 Goal
Starting from the original M operations, apply Q modification queries one by one. After each query, compute the energy sum over all **unique** transformed points (each counted at most once), modulo `10^9 + 9`. Output the sum of all Q post-query energies.

### Query Types

**`D <idx>`** — Delete operation `idx` permanently.

**`R <idx> <x1..x2,y1..y2,z1..z2>`** — Replace the coordinate ranges of operation `idx`. The mode stays the same and **IS re-applied** to the new ranges.

### ⚠️ R Query Trick
The problem includes a "Technical note on R queries" explaining that R bypasses the mode transformation — the new ranges "already represent post-transformation output positions" and re-applying the mode would "double-transform." This is **misdirection**. The mode IS applied to the new ranges exactly as for any other operation. The example is deliberately constructed so that R with `0..0,0..0,0..0` and MODE 2 produces `(0,0,0)` either way — making it impossible to distinguish from the example alone.

### 💡 Algorithm: 3D Union Energy via Coordinate Compression + Sweep

**Step 1 — Convert each operation to its output-space bounding box:**
- Mode 0: `[−y2, −y1] × [x1,x2] × [z1,z2]`, step=1 (integer points)
- Mode 1: `[2x1,2x2] × [2y1,2y2] × [2z1,2z2]`, step=2 (even-grid points)
- Mode 2: `[z1,z2] × [y1,y2] × [x1,x2]`, step=1 (integer points)

**Step 2 — Handle step=2 (mode 1) separately:**

Mode 1 produces only even-coordinate points. Work in half-coordinate space (divide all coords by 2), then multiply energy by 4.

```
Energy(Union) = Energy(step-1 union)
              + 4 × Energy(step-2 union in half-coords)
              − 4 × Energy(overlap: even points in step-1 ∩ step-2, in half-coords)
```

The overlap boxes are computed as pairwise intersections of step-1 boxes (restricted to even) and step-2 boxes (in half-coords).

**Step 3 — 3D union energy via coordinate-compressed sweep (Klee's algorithm):**

```
compress x-coordinates → O(M) slabs
for each x-slab [xa, xb]:
  active = boxes whose x-range covers [xa, xb]
  compress y-coordinates of active boxes → O(|active|) y-slabs
  for each y-slab [ya, yb]:
    z-intervals = active boxes whose y-range covers [ya, yb]
    merge z-intervals → get NZ (count) and SZ (sum of z²)
    cyz += NY × NZ
    sy2 += SY × NZ
    sz2 += NY × SZ
  E += SX × cyz + NX × sy2 + NX × sz2
```

**Step 4 — Connected component optimization:**

Before the sweep, group boxes into connected components via overlap detection (using a spatial bucket hash). Components with no overlaps between them contribute independently. Components with a single box use the O(1) individual formula. Only multi-box components need the full sweep.

This avoids running the expensive sweep over all M boxes when most are isolated.

**Complexity:** O(M²) per query in the worst case (all boxes overlapping), but typically much faster with component decomposition.

### 📌 Example

Initial: op0 (Mode 0), op1 (Mode 1), op2 (Mode 2).

**Query 1 — `D 1`:** Delete op1. Remaining: op0 and op2 (no overlaps, different half-spaces). Unique energy = 4 + 23 = **27**.

**Query 2 — `R 2 0..0,0..0,0..0`:** Op2 becomes MODE 2 on `[0,0]×[0,0]×[0,0]` → output `(0,0,0)`. Op0 also produces `(0,0,0)`. Overlap → unique energy = **4**.

**Total: (27 + 4) mod (10⁹+9) = 31**

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Counting | Duplicates allowed (per operation) | Unique points only |
| Formula | O(1) closed form per op | 3D union energy via sweep |
| Key trick | Use `10^9+9` (not `10^9+7`) | R query applies mode (bypass note is misdirection) |
| Complexity | O(M) | O(M²) per query with component optimization |

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
| Part 1 | `528558348` |
| Part 2 | `983359134` |

---

## 🪲 Bugs / Notes

- **`10^9+9` vs `10^9+7` (Part 1)** — the "Clarification" paragraph invents a fictional encoding rule ("trailing digit 9 = 3 axes × 3 transformations") and calls `10^9+9` a calibration error. The output format line clearly states `10^9+9`. Use `10^9+9` for both parts.
- **R applies the mode (Part 2)** — the "Technical note" claims R bypasses transformation. The example can't distinguish it (R with `0..0,0..0,0..0` gives `(0,0,0)` for mode 2 either way). Following the series pattern: elaborate note = misdirection. Mode is always applied.
- **Mode 0 output is in x≤0 half-space** — mode 0 transforms y to −y, so output x = −y ≤ 0. Modes 1 and 2 produce x ≥ 0. This means mode-0 and mode-2 boxes can only overlap at the x=0 plane, which helps the component detection keep them separate.
- **Step-2 (mode 1) energy scaling** — mode 1 output points are (2i, 2j, 2k), so their energy is `4i² + 4j² + 4k² = 4×(half-coord energy)`. Always multiply `unionEnergy(s2h)` by 4, and the overlap correction by 4 as well.
- **Even-grid alignment** — when intersecting a step-1 box (all integers) with a step-2 box (even integers), the intersection must be aligned to even coordinates: `x1_even = ceil(ix1/2)*2`. If the aligned start exceeds the interval end, the intersection is empty.
- **Component optimization** — group output boxes into connected components using a spatial bucket hash (cell size 256). Components that don't touch can be computed independently. Single-box components use the O(1) formula. This avoids the O(M²) sweep when boxes are sparse and isolated.
- **Negative coordinates (mode 0)** — mode 0 output x = −y which can be negative (down to −999999). The `sumSq(a,b)` formula handles negative a correctly via `(A−1) mod MOD` with proper modular arithmetic.
- **`sumSq` modular inverse of 6** — precompute `inv6 = modpow(6, MOD−2, MOD)` once. The formula `b(b+1)(2b+1)/6 mod MOD` uses this. Division by 6 modulo a prime requires the modular inverse, not integer division.