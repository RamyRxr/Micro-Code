# Challenge 06 — Linguistic Roots 🌳

<!-- nav -->
<p align="center"><a href="../challenge-05/readme.md">⬅ Challenge 05</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-07/readme.md">Challenge 07 ➡</a></p>

## 📖 Story
The crew touched down safely on a nearby planet, only to be greeted by a crowd of LMKOULYIN with weapons raised. Lmkouli, who has been studying human languages, pushes through and stands them down. He pulls out a translation file — a structured tree of linguistic roots where every word traces back through ancestor nodes to a common origin. To establish two-way communication, Adel must analyze the ancestor relationships in this tree and compute aggregate values that will power the translation matrix.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Compute compressed ancestor value from the tree |
| `part-2.js` | Compute total LCA depth sum across all pairs |
| `input.txt` | Line 1: N, Lines 2–N: parent-child relationships |

---

## 📥 Input Format

```
5
0 1
0 2
1 3
1 4
```

- **Line 1:** `N` — number of nodes (1 ≤ N ≤ 2000), labeled 0 to N−1
- **Lines 2 to N:** Each line `P C` means node `P` is the parent of node `C`
- Root is always node `0`. Each node has at most two children.
- Parent indices always appear before their children in the input.

---

## 🌲 Tree Structure (Example)

```
        0  (depth 0)
       / \
      1   2  (depth 1)
     / \
    3   4  (depth 2)
```

---

## Part 1 — Compressed Ancestor Value

### 🎯 Goal
Build the ancestor matrix where `mat[i][j] = 1` if node `i` is an ancestor of node `j` (a node is NOT its own ancestor). Compute:

```
result = sum of mat[i][j] * (j - i)²    for all 0 <= i, j < N
```

Output: `result mod 1,000,000,007`

### 📌 Example

Ancestor pairs and their contributions:

| i | j | (j−i)² |
|---|---|--------|
| 0 | 1 | 1 |
| 0 | 2 | 4 |
| 0 | 3 | 9 |
| 0 | 4 | 16 |
| 1 | 3 | 4 |
| 1 | 4 | 9 |

**result = 1 + 4 + 9 + 16 + 4 + 9 = 43**

### 💡 Approach
Instead of building the full N×N matrix, for each node `i` do a DFS downward to visit all its descendants. Every node `j` reached is a descendant of `i`, so immediately add `(j − i)²`:

```js
for (let i = 0; i < N; i++) {
  const stack = [...children[i]];
  while (stack.length) {
    const j = stack.pop();
    const diff = BigInt(j - i);
    result = (result + diff * diff) % MOD;
    stack.push(...children[j]);
  }
}
```

**Complexity:** O(N²) — each node pair visited at most once. No N×N matrix ever built in memory.

---

## Part 2 — LCA Depth Sum

### 🎯 Goal
For every pair of distinct nodes `(i, j)` where `i < j`, find their Lowest Common Ancestor — the deepest node that lies on both paths from root to `i` and root to `j`. A node IS its own ancestor for LCA purposes.

Compute:
```
S = sum of depth(LCA(i, j))    for all 0 <= i < j < N
```

Output: `S mod 1,000,000,007`

### 📌 Example

| Pair | LCA | depth |
|------|-----|-------|
| (0,1) | 0 | 0 |
| (0,2) | 0 | 0 |
| (0,3) | 0 | 0 |
| (0,4) | 0 | 0 |
| (1,2) | 0 | 0 |
| (1,3) | 1 | 1 |
| (1,4) | 1 | 1 |
| (2,3) | 0 | 0 |
| (2,4) | 0 | 0 |
| (3,4) | 1 | 1 |

**S = 0+0+0+0+0+1+1+0+0+1 = 3**

### 💡 Approach — Three Simple Functions

**`pathToRoot(node)`** — walk up via `parent[]` until hitting `-1`, collect every node:
```js
function pathToRoot(node) {
  const path = [];
  while (node !== -1) { path.push(node); node = parent[node]; }
  return path;
}
// pathToRoot(3) → [3, 1, 0]
```

**`depth(node)`** — path length minus 1 (the node itself doesn't count as a step):
```js
function depth(node) { return pathToRoot(node).length - 1; }
// depth(3) = 2,  depth(0) = 0
```

**`lca(i, j)`** — put `i`'s ancestors in a Set, walk `j`'s path upward, first match is the LCA:
```js
function lca(i, j) {
  const ancestorsI = new Set(pathToRoot(i));
  for (const node of pathToRoot(j)) {
    if (ancestorsI.has(node)) return node;
  }
}
// lca(3, 4): Set={3,1,0}, walk [4,1,0] → first hit is 1 ✓
```

Then a plain double loop over all pairs:
```js
for (let i = 0; i < N; i++)
  for (let j = i + 1; j < N; j++)
    S = (S + BigInt(depth(lca(i, j)))) % MOD;
```

**Complexity:** O(N² × depth) — with N ≤ 2000 this runs comfortably within seconds.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Core structure | Children list + DFS | Parent array + path walking |
| Per pair operation | `(j − i)²` | `depth(LCA(i, j))` |
| Traversal direction | Downward (ancestor → descendants) | Upward (node → root) |
| Complexity | O(N²) | O(N² × depth) |

---

## 💡 Why `MOD = 1_000_000_007n`?

- The `n` suffix makes it a **BigInt** — required because raw sums can exceed JavaScript's safe integer limit
- `1_000_000_007` is a **prime number** — the standard modulus in competitive programming, with nice mathematical properties
- The underscores are just visual separators (`1_000_000_007 === 1000000007`)
- Taking `% MOD` at every step keeps the running sum between `0` and `1,000,000,006` at all times

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
| Part 1 | `98142952` |
| Part 2 | `1110434` |

---

## 🪲 Bugs / Notes

- **`parent` vs `children`** — Part 1 uses a children list (DFS downward), Part 2 uses a parent array (walk upward). Each direction is the natural fit for its problem.
- **Node is NOT its own ancestor in Part 1** — DFS starts from `children[i]`, skipping `i` itself. In Part 2, a node IS its own ancestor for LCA (so `LCA(i,i) = i`), but the loop only runs `i < j` so self-pairs never appear.
- **Leading `-1` in parent array** — root node 0 has `parent[0] = -1`. The `while (node !== -1)` loop in `pathToRoot` uses this as the stop condition.