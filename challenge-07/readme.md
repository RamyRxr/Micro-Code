# Challenge 07 — Genetic Drift Simulator 🧬

<!-- nav -->
<p align="center"><a href="../challenge-06/readme.md">⬅ Challenge 06</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-08/readme.md">Challenge 08 ➡</a></p>

## 📖 Story
Communication is flowing between the crew and the LMKOULYIN. But before the crew can leave, Lmkouli leads them to the planet's hospital ward. The children here are born with 8-bit genetic codes that drift over time under intense cosmic radiation — bits flip, sequences recombine, patterns emerge. The hospital's computing system broke down weeks ago, and without a simulation engine the doctors can no longer plan treatments ahead of time. Adel pulls up a chair at the broken terminal. The crew has time before the launch window opens.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Simulate genetic drift using raw bit-count strength |
| `part-2.js` | Same simulation using resemblance to a shifting reference key |
| `input.txt` | Line 1: P groups, then 4 sequences per group |

---

## 📥 Input Format

```
1
10100000
00001010
11100000
00000111
```

- **Line 1:** `P` — number of patient groups
- **Lines 2 to 4P+1:** 4 sequences per group, each exactly 8 characters of `0` and `1`
- Bit positions are 0-indexed from the left (position 0 = leftmost)

---

## 🔁 Shared Simulation Structure (Both Parts)

Each group runs for exactly **1000 generations**. After each generation, record the sum of decimal values of all 4 sequences. The **treatment burden** for a group is the total across all 1000 generations. The **grand total** is the sum of all groups' burdens.

Each generation applies 5 steps in order:

| Step | Name | Description |
|------|------|-------------|
| 1 | Selection | Find First (highest strength/resemblance, tie → higher index wins) and Second |
| 2 | Blend point | Compute `split` from strengths/resemblances |
| 3 | Recombination | Produce two offspring by splitting and swapping |
| 4 | Radiation strike | Flip one bit in both offspring |
| 5 | Rotation | Right-rotate the 4-element array by `gen mod 4` |

---

## Part 1 — Raw Strength Model

### 🎯 Goal
Strength = number of `1` bits in a sequence. Simulate 1000 generations per group and sum all decimal values across every generation.

### 📌 Example Walkthrough (Generation 1)

Starting population: `[10100000, 00001010, 11100000, 00000111]`

**Step 1 — Selection:**
```
Strengths: [2, 2, 3, 3]
Tie at index 2 and 3 → higher index wins → First = 00000111 (idx 3), Second = 11100000 (idx 2)
```

**Step 2 — Blend point:**
```
split = (3 + 3) mod 7 + 1 = 7
```

**Step 3 — Recombination:**
```
Offspring 1 = 0000011 + 0 = 00000110
Offspring 2 = 1110000 + 1 = 11100001
```

**Step 4 — Radiation strike:**
```
strike = (1×3 + 3) mod 8 = 6
Offspring 1: 00000110 → 00000100
Offspring 2: 11100001 → 11100011
```

**Step 5 — Rotation (right by 1):**
```
[00000111, 11100000, 00000100, 11100011] → [11100011, 00000111, 11100000, 00000100]
Sum: 227 + 7 + 224 + 4 = 462
```

### 💡 Key implementation notes

**Tie-breaking:** use `>=` when comparing strengths so higher indices naturally win:
```js
for (let i = 1; i < 4; i++) if (strengths[i] >= strengths[firstIdx]) firstIdx = i;
```

**Right rotation by k:**
```js
const rotated = [...arr.slice(arr.length - k), ...arr.slice(0, arr.length - k)];
```
When `k = 0` (gen mod 4 = 0), `slice(-0)` would break — `arr.slice(arr.length - 0)` returns the whole array. The formula `arr.length - k` handles `k=0` safely since `arr.slice(4)` returns `[]`.

---

## Part 2 — Shifting Reference Model

### 🎯 Goal
Replace raw bit-count strength with **resemblance** to a shifting reference key. The reference key starts as `11010110` and may update at the start of each generation.

### 🔑 Resemblance
```
resemblance(s, ref) = 8 − (number of positions where s and ref differ)
```
Perfect match = 8, completely opposite = 0.

### 📅 Reference Key Update Rules (start of each generation, before selection)

**Rule 1** — triggers when `gen mod 100 === 0`:
1. Rotate left by 1 (leftmost bit → rightmost)
2. Flip bits at positions 2 and 5

**Rule 2** — triggers when `gen mod 250 === 0`:
- Reverse the entire key string

When **both** trigger (generations 500 and 1000): Rule 1 runs first, then Rule 2 on the result. Reference key **resets to `11010110`** at the start of each new group.

### 📐 Split Formula (depends on reference key state)
After updating the key, count its `1` bits:
```
ones > 4  →  split = (rFirst + rSecond + 2) mod 7 + 1
otherwise →  split = (rFirst + rSecond) mod 7 + 1
```

### 📌 Example Walkthrough (Generation 1)

Reference key: `11010110` (unchanged, gen=1 not divisible by 100)

```
Resemblances to 11010110: [3, 3, 4, 4]
First = 00000111 (idx 3, res=4), Second = 11100000 (idx 2, res=4)
ones in ref = 5 (> 4) → split = (4+4+2) mod 7 + 1 = 4

Offspring 1 = 0000 + 0000 = 00000000
Offspring 2 = 1110 + 0111 = 11100111

strike = (1×3 + 4) mod 8 = 7
Offspring 1: 00000000 → 00000001
Offspring 2: 11100111 → 11100110

Rotate right by 1 → [11100110, 00000111, 11100000, 00000001]
Sum: 230 + 7 + 224 + 1 = 462
```

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Strength metric | Count of `1` bits | Resemblance to reference key |
| Reference key | None | Starts at `11010110`, shifts over time |
| Split formula | `(sFirst + sSecond) mod 7 + 1` | Depends on ones count in ref key |
| Radiation strike | `(gen×3 + sFirst) mod 8` | `(gen×3 + rFirst) mod 8` |

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
| Part 1 | `154038932` |
| Part 2 | `106629120` |

---

## 🪲 Bugs / Notes

- **Tie-breaking with `>=`** — using strict `>` would give the lower index on a tie. The problem says higher index wins, so `>=` is correct for both the First and Second search passes.
- **Rotation when k=0** — `arr.slice(-0)` in JS returns the full array, not an empty array. Using `arr.slice(arr.length - k)` avoids this edge case safely.
- **Reference key resets per group** — `ref = "11010110"` must be inside the group loop, not outside it.
- **Both rules on gen 500 and 1000** — Rule 1 modifies the key first, then Rule 2 reverses the already-modified key. Order matters.
- **Radiation uses resemblance in Part 2** — `strike = (gen×3 + rFirst) mod 8`, not the raw bit count.