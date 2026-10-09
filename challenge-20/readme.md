# Challenge 20 — Cargo Bid Optimizer 📦

<!-- nav -->
<p align="center"><a href="../challenge-19/readme.md">⬅ Challenge 19</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a></p>

## 📖 Story
With the landing sequence armed, the last job was the cargo manifest. The hold is packed with scarce items, and several factions back on Earth have submitted competing bids for them. A bid names the items it wants, a price, items it refuses to ship alongside (exclusions), and other bids it depends on (dependencies). Some item categories clash, adding penalties when selected together. Mission control keeps changing its mind — banning bids, repricing, or forcing a bid into the manifest — and Adel needs to answer the best achievable profit after every change.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Best achievable profit for the initial bids |
| `part-2.js` | Same solver with ban / reprice / force / k-th-best queries |
| `input.txt` | Header, categories, bids, penalty matrix, then queries |

---

## 📥 Input Format

```
138 242 31
8 8 15 20 1 1 12 8 6 ...
3519 94 18 133 |  >
5047 88 20 133 | | >
...
<C penalty-matrix rows>
14
B 52
C 52 6976
K 2
A 7
...
```

- **Line 1:** `N B C` — items, bids, categories
- **Line 2:** `N` item→category ids
- **Next `B` lines:** `price item… | exclusion… | dependency…` (empty sections allowed)
- **Next `C` lines:** the `C × C` category penalty matrix
- **Then:** `Q` and `Q` query lines

| Query | Meaning |
|-------|---------|
| `B id` | Permanently ban bid `id` |
| `C id price` | Change bid `id`'s price |
| `K k` | Report the `k`-th best **distinct** profit |
| `A id` | Force bid `id` into the manifest (with its dependencies) |

---

## Shared Model

A bid can be selected only if:

- none of its items are already used by another selected bid,
- neither it nor a conflicting bid is excluded by the other,
- **all of its transitive dependencies** are selected (dependency closure is precomputed with DFS).

Selecting bids `i` and `j` together adds a penalty equal to the sum of the category-penalty matrix over the full cross-product of their categories.

**Score = Σ price(selected) − Σ pairwise penalties.**

---

## Part 1 — Initial Optimum

### 🎯 Goal
Report the maximum achievable score over the original bids.

### 💡 Approach
**DFS branch-and-bound** over bids in index order, with a suffix-price upper bound:

```js
function dfs(i, score) {
  if (score > best) best = score;
  if (i >= B) return;
  if (score + suffixPrice[i] <= best) return;   // prune
  dfs(i + 1, score);                            // exclude branch
  if (!canInclude(i)) return;                   // include branch
  ... // mark items, bump exclusions, recurse with score + price − penalty
}
```

**Complexity:** exponential worst case, but the suffix bound plus item/exclusion pruning keeps it fast on the provided input.

---

## Part 2 — Live Queries

### 🎯 Goal
Apply each query in order to the running solver state and accumulate the answer of each into a single total.

### 💡 Approach
The solver keeps mutable state — `banned[]`, `forced[]`, and a live `prices[]` — and rebuilds active bids before each solve:

- **`B id`** — mark banned; if a **forced** bid transitively depended on it, ban that too.
- **`C id price`** — overwrite the price.
- **`A id`** — validate the full dependency closure (no item clashes, no exclusion conflicts with already-forced bids); if valid, force it and ban everything its items or exclusions rule out. Invalid force adds `0`.
- **`K k`** — collect **distinct** scores during DFS and return the `k`-th largest.

Forced bids are pre-placed, and inactive/banned bids are skipped, so the same DFS core answers every query.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Input | Bids only | Bids + queries |
| Output | One profit | Sum over all queries |
| State | Immutable | Mutable (ban / reprice / force) |
| Query support | None | `B`, `C`, `K`, `A` |
| Search | Branch-and-bound DFS | Same DFS, state-aware |

---

## ▶️ How to Run

```bash
node part-1.js
node part-2.js
```

`input.txt` must be in the same folder as the scripts. (Part 2 also looks for an
optional `queries.txt` if the queries are not embedded in `input.txt`.)

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `62296` |
| Part 2 | `13586505` |

---

## 🪲 Bugs / Notes

- **Dependencies are transitive** — a bid's dependency closure must be selected in full; precompute it once with DFS rather than checking only direct deps.
- **Penalties are a cross-product** — for categories `A` (of bid `i`) and `B` (of bid `j`), add `pen[a][b]` for **every** pair `a ∈ A, b ∈ B`, not just the same category.
- **`A` can fail** — forcing a bid may be impossible (item clash or exclusion conflict); an invalid force contributes `0`, and the solver state must remain unchanged.
- **`K` counts distinct scores** — the `k`-th best must be a distinct value, so duplicates collected across branches must be de-duplicated.
- **Banning cascades through forced bids** — if a forced bid depends on a newly banned bid, the forced bid becomes illegal and is banned as well.
- **Suffix-price bound uses the topological order** — dependencies are ordered before dependents so the bound stays valid; the input is guaranteed to be a DAG.
