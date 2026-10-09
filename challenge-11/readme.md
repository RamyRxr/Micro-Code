# Challenge 11 — Starlight Array ♕

<!-- nav -->
<p align="center"><a href="../challenge-10/readme.md">⬅ Challenge 10</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-12/readme.md">Challenge 12 ➡</a></p>

## 📖 Story
The relay clusters were mapped, but the ship's long-range sensor array had drifted out of alignment during the crossing. Each of the `N` sensor nodes sits somewhere on an `N × N` grid, and to avoid mutual interference no two nodes may share a **row**, **column**, or **diagonal** — the classic non-attacking arrangement. The nodes can't all be moved freely; every node dragged off its current position costs the crew time. Adel needs the cheapest valid realignment, and then a way to fingerprint the winning layout so it can be stored in the calibration log.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Cheapest realignment + base-`C` fingerprint |
| `part-2.js` | Cheapest realignment by total displacement + fingerprint |
| `input.txt` | `N` rows, each an `N`-character row with one `o` (current node) |

---

## 📥 Input Format

```
...o..........
......o.......
......o.......
.....o........
...
```

- Each line is one row of the board, length = number of lines = `N`
- `o` marks the node's **current** column in that row
- A valid solution places exactly one node per row and column, with no two on a shared diagonal

---

## Part 1 — Minimal Rows Moved

### 🎯 Goal
Find a valid non-attacking placement that **minimizes the number of rows whose node moved** (`C`), then fingerprint it and output the fingerprint.

### 💡 Approach
**Backtracking (N-Queens) with tie-breaking.**

- Place queens row by row, rejecting used columns (`usedCol`) and both diagonals (`row − c` and `row + c`).
- At a complete board, compute `C = number of rows where cols[r] !== startCols[r]`.
- Keep the solution with the **smallest `C`**; on a tie, keep the **largest fingerprint**.
- Fingerprint uses the base-`C` polynomial `encode(cols, C)`, reduced mod `10000027`. Note the exponent pattern — `cols[0]` is the units term, then `cols[1] · C²`, `cols[2] · C³`, … (`C¹` is intentionally skipped). When `C = 0` the fingerprint is just `cols[0]`.

**Complexity:** O(N!) worst case, but N-Queens with diagonal pruning is fast for the input sizes here (N = 14).

---

## Part 2 — Minimal Total Displacement

### 🎯 Goal
The same valid placement, but now cost is the **total absolute displacement**:

```
C = Σ |cols[i] − startCols[i]|
```

Among all placements minimizing `C`, keep the one with the **largest unfingerprinted** value, then output it mod `10000027`.

### 💡 Approach
Identical backtracking. Two changes from Part 1:

1. `C` is summed absolute distance, not a count of moved rows.
2. The fingerprint is accumulated as a **raw BigInt** (`C^k` grows huge) with **no modulo during comparison** — the winner is picked on the true integer value, and `% MOD` is applied only once at the very end.

**Complexity:** O(N!) worst case, O(N²) memory.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Cost `C` | Count of moved rows | Sum of absolute displacements |
| Fingerprint | `encode(...) mod MOD` during comparison | Raw BigInt, `% MOD` only at the end |
| Tie-break | Largest fingerprint | Largest fingerprint |
| Core search | N-Queens backtracking | N-Queens backtracking |

---

## ▶️ How to Run

```bash
node part-1.js
node part-2.js
```

`input.txt` must be in the same folder as the scripts.

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `9298510` |
| Part 2 | `8300389` |

---

## 🪲 Notes

- **Base-`C` exponent skips `C¹`** — the fingerprint is `cols[0] + cols[1]·C² + cols[2]·C³ + …`. Both parts use this same pattern; changing the exponent layout changes every answer.
- **`C = 0` is a special case** — the loop would otherwise multiply by `0` and collapse the fingerprint to `cols[0]`, so the code returns early.
- **Part 2 must not reduce mod `MOD` mid-comparison** — reducing early destroys the tie-break ordering. Keep the polynomial as a full BigInt and mod once at output.
- **`MOD = 10000027n`** — not a conventional `10⁹+7`; it's the problem's own modulus, so don't "correct" it.
- **Board symmetry** — N-Queens has many mirrored solutions; the tie-break (largest fingerprint / displacement) is what selects exactly one.
