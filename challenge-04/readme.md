# Challenge 04 — Zero-G Kitchen Rotation 🍽️

<!-- nav -->
<p align="center"><a href="../challenge-03/readme.md">⬅ Challenge 03</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-05/readme.md">Challenge 05 ➡</a></p>

## 📖 Story
The signal is back and Oum Walid's recipe saved iftar. Now the crew needs a system for the rest of Ramadan. They agree on a rotation — each day some crew members cook while others keep the mission running. The problem: they eat around a **circular dining module**, and galley stations are so tight that no two crew members seated next to each other can cook at the same time (they'd be elbowing each other in zero gravity). Part 2 adds a twist: cooking in zero gravity is exhausting, and each crew member needs `K` rounds to recover before they can cook again.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Minimum rounds with adjacency constraint only |
| `part-2.js` | Minimum rounds with adjacency + cooldown `K` |
| `input.txt` | Line 1: dishes (comma-separated), Line 2: K |

---

## 📥 Input Format

```
3,2,1,4,2
1
```

- **Line 1:** Comma-separated dishes each crew member must cook, in clockwise order
- **Line 2:** Cooldown value `K`
- The table is **circular** — first and last members are neighbors

---

## ⚙️ Constraints

- In each round, chosen crew members must form an **independent set** (no two neighbors cook together)
- Each chosen crew member prepares exactly **one dish** per round
- **Part 2 only:** after cooking, a member cannot cook again for the next `K` rounds

---

## Part 1 — Adjacency Only

### 🎯 Goal
Find the minimum number of rounds for all crew members to finish their dishes, subject only to the adjacency constraint (no two neighbors in the same round).

### 📌 Example

```
Input: 3,2,1,4,2
```

One optimal schedule: round 1 {0,3}, round 2 {2,4}, round 3 {0,3}, round 4 {1,4}, round 5 {0,3}, round 6 {1,3}

**Output:** `6`

### 💡 Approach

The answer is the maximum of two lower bounds — both always achievable:

```
answer = max(
  max single dish count,      // member i needs at least dishes[i] rounds
  max adjacent pair sum       // pair (i,j) can never cook same round
)
```

**Why the pair sum works:** members `i` and `j` can never cook in the same round, so their combined `dishes[i] + dishes[j]` work must be spread across separate rounds — making it the tight bottleneck.

```js
const maxSingle = Math.max(...dishes);

let maxPair = 0;
for (let i = 0; i < n; i++) {
  maxPair = Math.max(maxPair, dishes[i] + dishes[(i + 1) % n]);
}

console.log(Math.max(maxSingle, maxPair));
```

**Complexity:** O(n) — single pass over all members and adjacent pairs.

---

## Part 2 — Adjacency + Cooldown K

### 🎯 Goal
Same problem, but after a crew member cooks in round `r`, they cannot cook again until round `r + K + 1`.

### 📌 Example

```
Input: 3,2,1,4,2   K=1
```

Crew member 3 needs 4 sessions. With K=1 they can cook every other round at most: rounds 1, 3, 5, 7. That's the bottleneck.

**Output:** `7`

### 💡 Approach

Two lower bounds, take the max:

**1. Single member cooldown bound:**
```
(dishes[i] - 1) * (K + 1) + 1
```
Member with 4 dishes and K=1: `(4-1)*2+1 = 7` — needs slots spaced at least K+1 apart.

**2. Adjacent pair bound (with cooldown):**
Two adjacent members can't share a round AND each has cooldown K. For each adjacent pair `[a, b]`, binary search for the minimum `R` where both can be scheduled.

The key insight: don't always force member `a` to start at round 1. Try **all `K+1` possible start offsets** for `a`, then greedily pack `b` into the remaining available slots:

```js
function canPair(a, b, K, R) {
  for (let start = 1; start <= K + 1 && start <= R; start++) {
    const iSlots = new Set();
    for (let x = 0; x < a; x++) {
      const s = start + x * (K + 1);
      if (s > R) break;
      iSlots.add(s);
    }
    let count = 0, lastJ = -Infinity;
    for (let r = 1; r <= R; r++) {
      if (!iSlots.has(r) && r >= lastJ + K + 1) {
        count++; lastJ = r;
        if (count === b) return true;
      }
    }
  }
  return false;
}
```

**Complexity:** O(n · K · R · log R) — binary search over R per adjacent pair.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Adjacency constraint | ✅ | ✅ |
| Cooldown constraint | ❌ | ✅ K rounds recovery |
| Single member bound | `dishes[i]` | `(d-1)*(K+1)+1` |
| Pair bound | `dishes[i] + dishes[j]` | Binary search + offset trial |
| Complexity | O(n) | O(n · K · R · log R) |

---

## ▶️ How to Run

```bash
node part-1.js
node part-2.js
```

`input.txt` must be in the same folder as the scripts, with dishes on line 1 and K on line 2.

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `5534` |
| Part 2 | `29035` |

---

## 🪲 Bugs / Notes

- **`K is not defined` error** — means `input.txt` only has one line. K must be on line 2, no exceptions.
- **Greedy offset bug** — always assigning member `a` to start at round 1 is too pessimistic. For pair `[1,4]` with K=1, forcing `a` to round 1 leaves `b` with only 3 usable slots in R=7. Shifting `a` to round 2 frees up `1,3,5,7` for `b`. Trying all K+1 offsets fixes this.
- **Circular adjacency** — the last and first members are neighbors. Always use `dishes[(i+1) % n]` to wrap around correctly.