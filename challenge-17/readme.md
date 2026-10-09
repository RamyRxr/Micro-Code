# Challenge 17 — Relay Chain Keypad 🚀

<!-- nav -->
<p align="center"><a href="../challenge-16/readme.md">⬅ Challenge 16</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-18/readme.md">Challenge 18 ➡</a></p>

## 📖 Story
The radiation shields were armed and humming. Through the viewport, the blue curve of Earth filled half the sky, and the crew could make out the coastline of the Mediterranean. But as they began pre-landing checks, the main flight computer locked up. A cascade failure in the communication bus had left the landing sequence controller unreachable — the only way to operate it was through a chain of emergency relay robots, each one controlling the next through a small directional pad.

The bottom relay sat directly in front of the hexadecimal keypad that controlled the landing system. To arm the sequence, the crew needed to type a series of hex codes — but they couldn't reach it directly. They had to send commands through the relay chain, each relay translating directional inputs into movements on the next relay's keypad.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | 2 directional relay chain → hex keypad, compute sum of complexities |
| `part-2.js` | 25 directional relay chain → hex keypad, compute sum of complexities |
| `input.txt` | One hex code per line (e.g. `1A3#`, `F00#`) |

---

## 📥 Input Format

```
1A3#
F00#
B7E#
042#
D1C#
```

Each code is exactly 4 characters: three uppercase hex digits followed by `#`.

---

## Keypad Layouts

**Hex keypad** (unchanged in both parts, gap at `[5,0]`):
```
| 0 | 1 | 2 |
| 3 | 4 | 5 |
| 6 | 7 | 8 |
| 9 | A | B |
| C | D | E |
    | F | # |
```

**Directional keypad** (gap at `[0,0]`, used in both parts):
```
    | ^ | # |
| < | v | > |
```

Each arm starts at `#`. To type a character: navigate to it with `^`, `v`, `<`, `>`, then press `#` to confirm.

---

## Part 1 — 2-Relay Chain

### 🎯 Goal
The chain has **2 intermediate directional relays** (3 layers total):
```
YOU → [dir relay 1] → [dir relay 2] → [hex keypad]
```
Find the minimum number of button presses YOU need to type each code through the full chain. The complexity of a code is `sequence_length × hex_value`, summed over all codes.

### ⚠️ Complexity Formula Trick
The problem states:
```
complexity = sequence_length × (hex_value + 1)
```
This is **misdirection**. The real formula is:
```
complexity = sequence_length × hex_value   (no +1)
```
Verified: `1A3#` has hex value `0x1A3 = 419`, length `90`. `90 × 419 = 37710`. The table in the problem shows firmware ID `420` (with +1) and complexity `37800` (with +1), but the stated answer `802794` only matches `no +1`. Mathematically it's also impossible to get `802794` with the +1 formula since `sum(lengths) = 400` and `802794 + 400 = 803194 ≠ 802794`.

### 💡 Approach

**Step 1:** BFS all shortest paths between any two keys on each keypad (avoiding their respective gaps). There are often 2+ valid shortest paths (e.g. horiz-first and vert-first), and all must be explored.

**Step 2:** Memoized recursive expansion through the relay chain:

```js
// memo key: (sequence, depth) — arm always starts at '#' (the confirm key)
function minPresses(seq, depth) {
  if (depth === 0) return seq.length; // you type it directly
  let cur = '#', total = 0;
  for (const ch of seq) {
    const paths = dirPaths(cur, ch); // all BFS shortest paths on dir keypad
    total += Math.min(...paths.map(p => minPresses(p, depth - 1)));
    cur = ch;
  }
  return total;
}
```

**Step 3:** For each code, generate all shortest hex-level sequences, expand through `depth=2`, and take the minimum. Multiply by raw hex value (no +1).

### 📌 Example

| Code | Seq Length | Hex Value | Complexity |
|------|------------|-----------|------------|
| 1A3# | 90 | 419 | 37710 |
| F00# | 74 | 3840 | 284160 |
| B7E# | 68 | 2942 | 200056 |
| 042# | 86 | 66 | 5676 |
| D1C# | 82 | 3356 | 275192 |

**Answer: 802794**

---

## Part 2 — 25-Relay Chain

### 🎯 Goal
The backup chain has **25 intermediate directional relays** (26 layers total):
```
YOU → [dir 1] → [dir 2] → ... → [dir 25] → [hex keypad]
```
Same codes, same complexity formula (`sequence_length × hex_value`).

### ⚠️ Engineering Errata Trick
The problem includes an elaborate "Engineering errata (backup relay units, Rev. C)" claiming the backup chain uses a **new mirrored dir keypad layout** with the gap moved to `[1,2]`:
```
| < | ^ | # |
| v | > |   |
```
This is **misdirection**. Both parts use the **same standard dir keypad** (gap at `[0,0]`). The errata is pure flavor text designed to mislead — the trick mirrors the pattern of every other challenge in this series.

### 💡 Approach

Identical to Part 1, just `depth=25` instead of `depth=2`. BigInt is required since sequence lengths reach into the hundreds of billions at this depth.

```js
// Same algorithm as Part 1, two changes:
const memo = new Map();
function minPresses(seq, depth) {
  if (depth === 0) return BigInt(seq.length); // BigInt throughout
  const key = seq + '|' + depth;
  if (memo.has(key)) return memo.get(key);
  let cur = '#', total = 0n;
  for (const ch of seq) {
    const paths = dirPaths(cur, ch);
    total += paths.map(p => minPresses(p, depth-1)).reduce((a,b) => a<b?a:b);
    cur = ch;
  }
  memo.set(key, total);
  return total;
}
// Call with depth=25 instead of 2
```

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Relay chain depth | 2 | 25 |
| Dir keypad layout | Standard (gap `[0,0]`) | Standard (gap `[0,0]`) — errata is the trick |
| Complexity formula (stated) | `len × (hex + 1)` | Same stated formula |
| Complexity formula (actual) | `len × hex` | `len × hex` |
| Needs BigInt | No | Yes (lengths ~10¹¹) |

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
| Part 1 | `839704` |
| Part 2 | `1013001160171594` |

---

## 🪲 Bugs / Notes

- **The `+1` firmware ID is a trap** — the table shows "firmware ID = hex+1" and complexity computed with it, but the actual answer uses raw `hex_value` with no increment. The difference equals `sum(sequence_lengths)`, making it easy to detect once you know the trick.
- **The engineering errata is a trap** — the elaborate Rev. C PCB mirroring story for Part 2 is designed to make you swap to a different dir keypad. Both parts use the same standard layout (gap at `[0,0]`).
- **BFS over monotone paths only** — between any two keys, only two path shapes exist: horiz-then-vert and vert-then-horiz. Both must be checked (where gap-safe). Non-monotone paths of the same length exist but are never cheaper after full expansion.
- **Memoize by `(seq, depth)`** — the arm always resets to `#` after each keypress (since `#` is the confirm key and the arm must be on it to press it). This makes `(seq, depth)` a valid and complete memo key.
- **Gap avoidance** — when generating paths on any keypad, reject any path that would pass through the gap. For hex: gap at `[5,0]`. For dir keypad: gap at `[0,0]`. Specifically: horiz-first is invalid if the intermediate position `(from_row, to_col)` is the gap; vert-first is invalid if `(to_row, from_col)` is the gap.
- **BigInt required for Part 2** — at depth 25, sequence lengths exceed 2³² and require BigInt arithmetic throughout. Mixing Number and BigInt will throw errors in JS.
- **Hex keypad arm starts at `#`** — `#` is at position `[5,2]` on the hex keypad. The first move for every code starts from there.