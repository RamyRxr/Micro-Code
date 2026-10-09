# Challenge 08 — Terminal Mind 🎮

<!-- nav -->
<p align="center"><a href="../challenge-07/readme.md">⬅ Challenge 07</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-09/readme.md">Challenge 09 ➡</a></p>

## 📖 Story
The crew is finally heading back to the rocket when Dr. Mkouli stops Adel at the airlock. She leads him to a small room where a flickering terminal sits against the wall. The children in the ward play a strategic board game against this terminal as part of their cognitive recovery — pattern recognition, forward planning, holding multiple moves in mind. But the thinking engine broke. Now it plays randomly, folds in seconds, and the children stopped showing up. "When there is no real challenge, they stop trying," Dr. Mkouli says. The launch window opens in two hours. Adel sits down.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Minimax engine — find the best move on a grid board |
| `part-2.js` | Tournament mode — best move accounting for a hidden opponent piece |
| `input.txt` | Board config on line 1, board state on remaining lines |

---

## 📥 Input Format

```
5;X;2;3-0,0|7-0,4
.....
.....
.XXX.
.....
.....
```

**Line 1:** `GRID_SIZE;YOUR_SYMBOL;DEPTH;WEIGHTS`

| Field | Description |
|-------|-------------|
| `GRID_SIZE` | Integer 5–7. Board is `GRID_SIZE × GRID_SIZE` |
| `YOUR_SYMBOL` | `X` or `O`. Opponent uses the other |
| `DEPTH` | Total placements simulated (your move + all responses) |
| `WEIGHTS` | Scenario list for Part 2: `W-R,C\|W-R,C\|...` |

**Remaining lines:** Board state. `.` = empty, `X`/`O` = placed pieces.  
Cells are 0-indexed. Position number = `row × GRID_SIZE + col`.

---

## ⚙️ Board Rules

- **Win condition:** 4 consecutive pieces of the same symbol — horizontal, vertical, or diagonal
- **Draw:** board completely full with no winner
- **Outcomes:** win = `+100`, loss = `−100`, draw/depth reached = `0`

---

## Part 1 — Minimax Engine

### 🎯 Goal
Find the single best move for your symbol using minimax search. Both sides always respond optimally.

### 📌 Example

```
Board: .XXX. on row 2 (positions 10–14)
You are X, DEPTH=2
```

| Candidate | Outcome | Position |
|-----------|---------|----------|
| (2,0) | XXXX → +100 | 10 |
| (2,4) | XXXX → +100 | 14 |

Both tie at +100 → lowest position wins → **Output: `10`**

### 💡 Approach — Minimax

```js
function minimax(b, depth, isMaximizing) {
  if (checkWin(b, mySymbol)) return 100;
  if (checkWin(b, OPP))      return -100;
  if (depth === 0 || isFull(b)) return 0;

  const sym = isMaximizing ? mySymbol : OPP;
  let best = isMaximizing ? -Infinity : Infinity;

  for each empty cell:
    place sym, recurse, remove sym
    update best (max or min)

  return best;
}
```

**Main loop:** try every empty cell as the opening move, call `minimax(board, DEPTH - 1, false)` — depth minus 1 because the opening move counts as placement 1. Pick highest value, tie-break by lowest position number.

**`checkWin`** — scans every cell as a potential run start, checks rightward/downward in all 4 directions only (avoids double-counting).

**Board mutation:** the board array is modified in-place and restored after each move — no copying, much faster.

---

## Part 2 — Tournament Mode (Weighted Scenarios)

### 🎯 Goal
Before each opponent turn, the opponent secretly places one extra piece. The `WEIGHTS` field lists possible hidden piece locations and their weights. For each candidate move, compute a **weighted total score** across all scenarios.

### 📐 Scenario Evaluation

For each candidate move `(mr, mc)` and each scenario `{w, r: hr, c: hc}`:

| Condition | Contribution |
|-----------|-------------|
| Hidden piece is at `(mr, mc)` — blocks your move | `w × −100` |
| Hidden piece gives opponent 4-in-a-row | `w × −100` |
| Otherwise | `w × minimax_outcome` |

Sum all scenario contributions → weighted total for that move. Pick highest, tie-break by lowest position.

### 📌 Example

**Scenarios:** hidden at (0,0) weight 3, hidden at (0,4) weight 7

| Move | Scenario (0,0) | Scenario (0,4) | Weighted Total |
|------|---------------|---------------|----------------|
| (2,0) pos 10 | 3×100=300 | 7×100=700 | **1000** |
| (2,4) pos 14 | 3×100=300 | 7×100=700 | **1000** |

Tie at 1000 → lowest position → **Output: `10`**

### 💡 Key implementation

```js
for (const { w, r: hr, c: hc } of scenarios) {
  if (hr === mr && hc === mc) { weightedTotal += w * -100; continue; }

  board[hr][hc] = OPP;
  if (checkWin(board, OPP)) { weightedTotal += w * -100; board[hr][hc] = "."; continue; }

  board[mr][mc] = mySymbol;
  const outcome = minimax(board, DEPTH - 1, false);
  board[mr][mc] = ".";

  weightedTotal += w * outcome;
  board[hr][hc] = ".";
}
```

The board is always fully restored after each scenario. The `minimax` function is **identical** to Part 1 — no changes needed.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Score per move | Single minimax outcome | Weighted sum across all scenarios |
| Hidden piece | None | Placed before evaluating each scenario |
| Minimax function | Unchanged | Unchanged |
| Tie-break | Lowest position number | Lowest position number |

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
| Part 1 | `15` |
| Part 2 | `43` |

---

## 🪲 Bugs / Notes

- **DEPTH counts the opening move** — the main loop places your piece (depth=1), then calls `minimax(board, DEPTH - 1, false)`. Don't pass `DEPTH` directly or you simulate one extra level.
- **Board restore order in Part 2** — always clear `board[mr][mc]` before `board[hr][hc]`. Both must be restored before moving to the next scenario or the board state corrupts.
- **`checkWin` direction** — only scan right and down from each cell. Scanning all directions double-counts runs and returns false positives.
- **Tie-break is on position number** — not on row/col separately. `pos = row × GRID_SIZE + col` is the single comparison value.