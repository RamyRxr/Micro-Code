# Challenge 02 — Orbital Formula Parser 🚀

## 📖 Story
Ramadan has begun in deep space. With no sunrise or sunset, the crew must compute precise fasting windows from orbital trajectory data. The ship's navigation computer expresses these as deeply nested compound formulas — one massive line of brackets, letters, and multipliers. Adel pulls it up on screen and gets to work.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Parse and evaluate the nested formula |
| `part2.js` | Same parser with a collapse rule applied at every bracket closure |
| `input.txt` | Puzzle input (single line formula) |

---

## 📥 Input Format

A single line containing a formula string:

```
A(B(C){4}){2}D
```

- **Base elements:** `A` = 247, `B` = 383, `C` = 156, `D` = 512
- **`(...){N}`** — contents inside parentheses multiplied by `N`
- Parentheses can be nested up to **50 levels** deep
- Every `(` has a matching `)` immediately followed by `{N}`

---

## Part 1 — Raw Energy Calculation

### 🎯 Goal
Parse the formula and compute the total energy by evaluating nested groups recursively (innermost first).

### 📌 Example

```
Input: A(B(C){4}){2}D
```

| Step | Operation | Value |
|------|-----------|-------|
| 1 | `C` | 156 |
| 2 | `(C){4}` → 156 × 4 | 624 |
| 3 | `B` + 624 | 1007 |
| 4 | `(B(C){4}){2}` → 1007 × 2 | 2014 |
| 5 | `A` + 2014 + `D` → 247 + 2014 + 512 | **2773** |

**Output:** `2773`

### 💡 Approach
**Recursive Descent Parser — O(n)**

A global index `i` walks through the formula. The `parse()` function handles 3 cases:

- **Letter** → look up value, add to total, advance `i`
- **`(`** → skip it, recurse to get group value, read `{N}`, multiply and add
- **`)`** → end of current group, break and return total to caller

Since it's recursive, deeply nested groups resolve naturally — innermost first, bubbling up.

---

## Part 2 — Stabilized Energy (Collapse Rule)

### 🎯 Goal
Same parser, but with a **collapse rule** applied at every bracket closure:

```
if internal_energy > 1000 → replace with internal_energy mod 1000
then multiply by N
then add to parent
```

### 📌 Example

```
Input: A(B(C){4}){2}D
```

| Step | Operation | Value |
|------|-----------|-------|
| 1 | `(C)` internal = 156. 156 > 1000? No. × 4 | 624 |
| 2 | `(B(C){4})` internal = 383 + 624 = 1007. 1007 > 1000? Yes → 1007 mod 1000 = 7. × 2 | 14 |
| 3 | `A` + 14 + `D` → 247 + 14 + 512 | **773** |

**Output:** `773`

### 💡 Approach
Identical recursive parser — only **two lines added** after each recursion returns:

```js
if (groupValue > 1000) {
  groupValue = groupValue % 1000;
}
```

This fires at every bracket closure before the multiplier is applied. Deeply nested chains stabilize level by level as the recursion unwinds.

---

## ▶️ How to Run

```bash
# Part 1
node part1.js

# Part 2
node part2.js
```

Make sure `input.txt` is in the **same folder** as the scripts.

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `308021261732` |
| Part 2 | `7732` |

---

## 🪲 Bugs / Notes

- The formula can be up to **50 MB** — no regex or stack-based string replacement would survive this. The recursive parser reads character by character in a single O(n) pass, so size doesn't matter.
- Multipliers `{N}` can reach **millions** — Part 1 numbers grow very large. Part 2's collapse rule keeps values small at every level, which is exactly why it exists.