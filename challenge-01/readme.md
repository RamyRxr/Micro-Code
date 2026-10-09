# Challenge 01 — Crescent Lock 🌙

<!-- nav -->
<p align="center"><a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-02/readme.md">Challenge 02 ➡</a></p>

## 📖 Story
Three months into a deep-space research mission, Adel and his crew realize it's the eve of Ramadan. With no horizon to scan, they power up the ship's long-range telescope array — which floods the console with **50,000 frequency readings**. Somewhere in that noise is a resonance signature that will confirm the crescent moon's position. The crew can't celebrate Ramadan until the code is found.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Find two frequencies that sum to `T` |
| `part-2.js` | Find three frequencies that sum to `T` with spread ≥ 1000 |
| `input.txt` | Puzzle input (T on line 1, 50,000 readings below) |

---

## 📥 Input Format

```
T
reading_1
reading_2
...
reading_50000
```

- **Line 1:** Target resonance `T` (positive integer)
- **Lines 2–50001:** 50,000 frequency readings (positive integers, each smaller than `T`)

---

## ⚙️ Constraints

- Exactly **one valid pair** exists for Part 1
- Exactly **one valid triplet** exists for Part 2
- Valid entries are placed **near the end** of the list

---

## Part 1 — Two-Frequency Lock

### 🎯 Goal
Find **two entries** from the list (on different lines) that sum to exactly `T`.  
Compute their **product**.

### 📌 Example

```
Input:        T = 10000
Readings:     1200, 4500, 3300, 5500
```

```
1200 + 4500 = 5700  ✗
4500 + 5500 = 10000 ✓
```

**Output:** `4500 * 5500 = 24750000`

### 💡 Approach
**Hash Set — O(n)**
- Walk through the readings once
- For each number `num`, check if `T - num` is already in the Set
- If yes → found the pair → print product and stop
- If no → add `num` to the Set and continue

This avoids the O(n²) brute-force approach which would be ~2.5 billion comparisons on 50,000 readings.

---

## Part 2 — Triple-Frequency Lock

### 🎯 Goal
Find **three entries** (each on a different line) that sum to exactly `T`,  
with the additional **spread condition:**

```
max(A, B, C) - min(A, B, C) >= 1000
```

Compute their **product**.

### 📌 Example

```
Input:        T = 10000
Readings:     1200, 4500, 3300, 5500
```

```
1200 + 3300 + 5500 = 10000  ✓
Spread: 5500 - 1200 = 4300 ≥ 1000 ✓
```

**Output:** `1200 * 3300 * 5500 = 21780000000`

### 💡 Approach
**Sort + Two Pointers — O(n²)**
- Sort the readings
- Fix `A` in the outer loop
- Use two pointers `lo` and `hi` on the rest to find `B + C = T - A` in O(n)
- When a valid sum is found, check the spread — if it passes, done; if not, nudge pointers inward

A brute-force triple nested loop would be O(n³) — roughly 20 trillion iterations on 50,000 readings, which would take hours. Two pointers brings it down to seconds.

---

## ▶️ How to Run

```bash
# Part 1
node part-1.js

# Part 2
node part-2.js
```

Make sure `input.txt` is in the **same folder** as the scripts.

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `3273098521` |
| Part 2 | `55308331382634` |

---

## 🪲 Bugs I Hit

- **`math` vs `Math`** — JavaScript's built-in is `Math` (capital M). `math.max()` throws a ReferenceError.
- **`break` in nested loops** — `break` only exits the innermost loop. Used a labeled `break outer` to exit all three loops at once.
- **Windows line endings (`\r\n`)** — Numbers were being parsed as `5500\r` instead of `5500`, silently breaking all comparisons. Fixed with `.replace(/\r/g, "")` before splitting.