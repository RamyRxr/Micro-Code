# Challenge 18 — Thermal Tile Partitioning 🚀

## 📖 Story
The rocket was screaming through the upper atmosphere, plasma trailing behind it like a comet's tail. The heat shield tiles glowed orange through the observation cameras, and the temperature readouts climbed with every second. Adel gripped the armrest as the ship shuddered — the thermal management system was failing.

The cooling units couldn't handle the load. The tiles needed to be divided into contiguous zones so the total thermal stress was as low as possible. Two cooling systems, two zone counts — and the wrong partition could tear the ship apart.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Partition first N1 tiles into K1 zones, minimize total stress |
| `part2.js` | Partition all N2 tiles into K2 zones, minimize total stress |
| `input.txt` | N1 K1 N2 K2 on line 1, tile heat loads on line 2 |

---

## 📥 Input Format

```
5 2 10 4
4 2 3 1 5 6 2 3 7 1
```

- **Line 1:** `N1 K1 N2 K2` — tile counts and zone counts for each part
- **Line 2:** Space-separated non-negative integers — the heat load of each tile

---

## Part 1 — Primary Cooling System

### 🎯 Goal
Divide the first `N1` tiles into `K1` contiguous zones (each with at least one tile) to **minimize the total thermal stress**.

### ⚠️ Stress Formula Trick
The problem description states the stress formula is `(S + 1)²`. This is **deliberate misdirection**. The actual formula is:

```
stress(zone) = S²
```

This can be verified mathematically: with tiles `[4, 2, 3, 1, 5]` and K=2, achieving the stated answer of 117 requires `6² + 9² = 117`, which only works with plain `S²`. The `(S+1)²` formula yields a minimum of 149 — and it's provably impossible to reach 117 with it (the discriminant is negative).

### 💡 Approach

Use **dynamic programming** with prefix sums:

```js
// dp[i][k] = min stress partitioning first i tiles into k zones
const dp = Array.from({length: N1 + 1}, () => new Array(K1 + 1).fill(Infinity));
dp[0][0] = 0;

for (let k = 1; k <= K1; k++) {
  for (let i = k; i <= N1; i++) {
    for (let j = k - 1; j < i; j++) {
      if (dp[j][k - 1] === Infinity) continue;
      const S = prefix[i] - prefix[j];
      dp[i][k] = Math.min(dp[i][k], dp[j][k - 1] + S ** 2);
    }
  }
}
```

**Complexity:** O(N1² × K1) with O(1) range sums via prefix array.

### 📌 Example

Tiles `[4, 2, 3, 1, 5]` with K1 = 2:

| Partition | Zone Sums | Zone Stress (S²) | Total |
|-----------|-----------|------------------|-------|
| [4] \| [2, 3, 1, 5] | 4, 11 | 16, 121 | 137 |
| **[4, 2] \| [3, 1, 5]** | **6, 9** | **36, 81** | **117** ✅ |
| [4, 2, 3] \| [1, 5] | 9, 6 | 81, 36 | 117 |
| [4, 2, 3, 1] \| [5] | 10, 5 | 100, 25 | 125 |

**Answer: 117**

---

## Part 2 — Backup Cooling System

### 🎯 Goal
Divide **all** `N2` tiles into `K2` contiguous zones (each with at least one tile) to **minimize the total thermal stress**.

### ⚠️ Stress Formula Trick (Again)
The problem describes a cubic stress model `(S + 1)³` for the backup system. This is also **misdirection**. The real formula is again:

```
stress(zone) = S²
```

Verified: the stated answer of 302 = `6² + 9² + 8² + 11²` with tiles `[4,2,3,1,5,6,2,3,7,1]` and K=4. Neither `(S+1)³` nor `S³` produces 302.

### 💡 Approach

Identical DP structure as Part 1, but using `N2` tiles and `K2` zones:

```js
const tiles = allTiles.slice(0, N2);

// Build prefix sums, then run same DP with N2, K2
```

### 📌 Example

All 10 tiles `[4, 2, 3, 1, 5, 6, 2, 3, 7, 1]` with K2 = 4:

**Answer: 302**

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Tiles used | First N1 | All N2 |
| Zones | K1 | K2 |
| Stress formula (stated) | `(S + 1)²` | `(S + 1)³` |
| Stress formula (actual) | `S²` | `S²` |
| Output | Min total stress | Min total stress |

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
| Part 1 | `129093904` |
| Part 2 | `3597229060` |

---

## 🪲 Bugs / Notes

- **The stress formula is a trap** — both parts describe elaborate physical justifications for `(S+1)²` and `(S+1)³` respectively, but both are misdirection. The correct formula in both cases is plain `S²`. Always verify against the example answer before trusting the problem description.
- **N2 vs N1 in Part 2** — Part 2 uses `N2` tiles (all tiles), not just the first `N1`. Easy to copy Part 1 and forget to swap.
- **BigInt may be needed** — for large inputs, `S²` values can exceed safe integer bounds. Part 2's answer `3597229060` exceeds 32-bit range; use standard JS numbers (safe up to 2⁵³) or BigInt if needed.
- **At least one tile per zone** — the DP loop starts at `i = k` and `j = k - 1` to enforce this constraint. Skipping it allows empty zones and produces wrong results.
- **Prefix sum off-by-one** — `prefix[i] - prefix[j]` gives the sum of tiles from index `j` to `i-1`. Ensure `prefix[0] = 0` and the array is length `N + 1`.