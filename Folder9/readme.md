# Challenge 09 — Patient Record Lookup 🏥

## 📖 Story
Word has spread fast across the planet: the genetic tracking system, the therapy terminal, the translation infrastructure. Now every hospital wants in. The scope is far bigger this time — patient records across all facilities are stored in a single massive character matrix, and each patient's file is identified by a hidden keyword embedded somewhere in the grid. The system must locate the exact coordinate path that spells each identifier under strict lookup rules, then extract related medical data using spatial proximity. A wrong match could link a patient to the wrong treatment file. Adel rolls up his sleeves. One more system, and then they leave.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Find the valid word path in the matrix, compute positional hash |
| `part2.js` | Same path + nearest twin extraction → weighted ASCII sum |
| `input.txt` | TARGET, WORD, MATRIX header, then matrix rows |

---

## 📥 Input Format

```
TARGET: 1
WORD: AB
MATRIX:
xAxxB
xxBxA
AxBxx
```

- **Line 1:** `TARGET: T` — signed integer checksum the sequence must satisfy
- **Line 2:** `WORD: W` — string to find character by character
- **Line 3:** `MATRIX:` — header
- **Remaining lines:** The character matrix (0-indexed, `ROWS × COLS`)

Grid coordinates are 0-indexed. Position number = `row × COLS + col`.

---

## Part 1 — Word Path Search

### 🎯 Goal
Find the unique sequence of coordinates `[(R1,C1), ..., (RL,CL)]` that spells WORD such that:

1. **Column progression:** `C1 < C2 < ... < CL` (strictly increasing columns)
2. **Target checksum:** `(R1−C1) + (R2−C2) + ... + (RL−CL) = TARGET`

Then compute the positional hash using 1-based indices:
```
Hash = (R1+1)×(C1+1) + (R2+1)×(C2+1) + ... + (RL+1)×(CL+1)
```

### 📌 Example

WORD = `AB`, TARGET = `1`

| A pos | B pos | C_A < C_B? | Checksum | = TARGET? |
|-------|-------|------------|----------|-----------|
| (0,1) | (0,4) | ✓ | (0−1)+(0−4) = −5 | ✗ |
| (0,1) | (1,2) | ✓ | (0−1)+(1−2) = −2 | ✗ |
| (0,1) | (2,2) | ✓ | (0−1)+(2−2) = −1 | ✗ |
| (2,0) | (0,4) | ✓ | (2−0)+(0−4) = −2 | ✗ |
| **(2,0)** | **(1,2)** | ✓ | (2−0)+(1−2) = **1** | ✅ |
| (2,0) | (2,2) | ✓ | (2−0)+(2−2) = 2 | ✗ |

Valid sequence: A at (2,0), B at (1,2) → 1-based: (3,1), (2,3)
```
Hash = (3×1) + (2×3) = 3 + 6 = 9
```

### 💡 Approach

**Pre-collect** all positions of each character in WORD (one scan of the matrix per unique char). Then **recursive search** building the path character by character:

```js
function search(idx, prevCol, checksumSoFar, path) {
  if (idx === L) {
    if (checksumSoFar === TARGET) sequence = [...path];
    return;
  }
  for (const [r, c] of positions[idx]) {
    if (c <= prevCol) continue;  // column must strictly increase
    path.push([r, c]);
    search(idx + 1, c, checksumSoFar + (r - c), path);
    path.pop();
    if (sequence) return;        // stop as soon as unique match found
  }
}
```

**Complexity:** O(ROWS × COLS × L) — pre-collection once, then recursive branching pruned by column constraint and early exit.

---

## Part 2 — Nearest Twin Extraction

### 🎯 Goal
For each coordinate `(Ri, Ci)` in the Part 1 sequence, find the nearest other cell containing the same character (the "twin"), extract its neighbors, and compute a weighted ASCII sum.

### 📐 Toroidal Distance
The grid wraps around in both dimensions:
```
D = min(|r1−r2|, ROWS−|r1−r2|) + min(|c1−c2|, COLS−|c1−c2|)
```

### ⚙️ Twin Rules
1. Same character as the original cell
2. Not the original cell itself
3. **Border constraint:** column must not be `0` or `COLS−1` (needs left and right neighbors)
4. **Tie-break:** lowest row index, then lowest column index

### 📤 Extraction
Once twin found at `(r, c)`:
- Left neighbor: `matrix[r][c−1]`
- Right neighbor: `matrix[r][c+1]`

Concatenate all pairs → payload string of length `2L`.

### 📐 Weighted ASCII Sum
```
Value = sum of ASCII(char_k) × k    for k = 1 to 2L
```

### 📌 Example

**A at (2,0):** other A's → (0,1) valid, (1,4) on border col 4 → invalid
- Twin: (0,1), dist = min(2,1) + min(1,4) = 2
- Extract: left `(0,0)='x'`, right `(0,2)='x'` → payload: `xx`

**B at (1,2):** other B's → (0,4) on border → invalid, (2,2) valid
- Twin: (2,2), dist = min(1,2) + min(0,5) = 1
- Extract: left `(2,1)='x'`, right `(2,3)='x'` → payload: `xxxx`

```
Weighted sum = 120×1 + 120×2 + 120×3 + 120×4 = 1200
```

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Core operation | Recursive word path search | Nearest twin + neighbor extraction |
| Grid topology | Flat | Toroidal (wraps in both dimensions) |
| Output | Positional hash | Weighted ASCII sum |
| Reuses Part 1 | — | ✅ Same sequence |

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
| Part 1 | `2036524` |
| Part 2 | `117299` |

---

## 🪲 Bugs / Notes

- **`lines.slice(3)` for matrix** — line 0 is TARGET, line 1 is WORD, line 2 is `MATRIX:`, matrix starts at line 3. Off-by-one here silently corrupts ROWS and shifts all coordinates.
- **Border constraint is column-based only** — rows 0 and ROWS−1 are NOT excluded. Only columns 0 and COLS−1 are off-limits for twins.
- **Toroidal wrapping** — don't forget the wrap is `min(|d|, SIZE − |d|)`, not just `|d|`. Missing this gives wrong distances on cells near opposite edges.
- **1-based vs 0-based** — the checksum uses 0-indexed coords, the hash uses 1-based `(r+1)*(c+1)`. Easy to mix up.
- **Early exit on search** — the problem guarantees exactly one valid sequence, so once found, propagate the exit up all recursion levels via `if (sequence) return`.