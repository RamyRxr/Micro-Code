# Challenge 12 — Memory Cleanup 🧹

<!-- nav -->
<p align="center"><a href="../challenge-11/readme.md">⬅ Challenge 11</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-13/readme.md">Challenge 13 ➡</a></p>

## 📖 Story
The ship's navigation computer was leaking memory. Every hop through the relay clusters left dangling objects behind — some still referenced, some orphaned, some tangled in reference cycles that a naive allocator can never reclaim. Before the crew could trust the computer again, Adel had to prove out two garbage-collection strategies on a replay log of the ship's own memory operations: reference counting, and periodic mark-and-sweep.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Reference-counting collector → total live bytes |
| `part-2.js` | Periodic mark-and-sweep → live bytes + drift vs. Part 1 |
| `input.txt` | `N R K`, then root ids, then `R` operation lines |

---

## 📥 Input Format

```
7713 92707 716
14 21 28 34 ...
ALLOC 0 1736
ALLOC 1 590
REF 0 5
DELREF 0 5
ADDROOT 12
DELROOT 12
```

- **Line 1:** `N R K` — object count, operation count, GC period
- **Line 2:** space-separated **root** object ids
- **Next `R` lines:** one operation per line

| Operation | Meaning |
|-----------|---------|
| `ALLOC id size` | Create object `id` with `size` bytes |
| `REF src dst` | `src` gains a reference to `dst` (duplicate is a **no-op**) |
| `DELREF src dst` | Remove that reference |
| `ADDROOT id` | `id` becomes a root (adds a reference) |
| `DELROOT id` | `id` stops being a root |

Any operation referencing a dead or unallocated object is ignored.

---

## Part 1 — Reference Counting

### 🎯 Goal
Simulate a **reference-counting** collector. Every root contributes one reference. When an object's reference count drops to zero it is freed, which cascades: each reference *out* of a freed object is released, potentially freeing more objects. Output the total size of all live objects at the end.

### 💡 Approach

```js
function freeObj(id) {
  alive[id] = 0;
  for (const dst of refs[id]) {
    if (!alive[dst]) continue;
    rc[dst]--;
    if (rc[dst] === 0) freeObj(dst);   // cascade
  }
  refs[id].clear();
}
```

- `ALLOC` sets `rc = rootSet.has(id) ? 1 : 0`
- `REF` ignores duplicates (counted once), otherwise `rc[dst]++`
- `DELREF` / `DELROOT` decrement and cascade-free on zero
- `ADDROOT` increments `rc`

**Complexity:** O(N + R) — each edge is walked at most once during cascading.

---

## Part 2 — Periodic Mark-and-Sweep

### 🎯 Goal
Run the same log, but reclaim with a **mark-and-sweep** collector triggered every `K` effective non-`ALLOC` operations. At the end, output:

```
part2Size × 1,000,000 + |part2Size − part1Size|
```

where `part1Size` is the reference-counting result from Part 1.

### 💡 Approach

- A `gcCounter` ticks after each applied `REF`/`DELREF`/`ADDROOT`/`DELROOT`; every `K` ticks, run `markAndSweep()`.
- **Mark:** DFS from every live root, following `REF` edges.
- **Sweep:** any live object not marked is freed, and its forward/backward reference lists are cleaned.
- To guarantee the two halves can never drift, Part 2 **reuses Part 1's output** by executing `part-1.js` as a child process instead of duplicating the counter logic:

```js
const part1Size = BigInt(execFileSync(process.execPath, [path.join(__dirname, 'part-1.js')], { encoding: 'utf8' }).trim());
```

**Complexity:** O(R × reachable-nodes) worst case — mark-and-sweep re-traverses the graph on every GC tick.

**Answer encodes both numbers in one integer**, so a single trailing value proves both collectors agree.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Collection strategy | Reference counting (eager) | Mark-and-sweep (periodic) |
| Cycles | Never reclaimed | Reclaimed |
| Trigger | Immediately at `rc = 0` | Every `K` non-`ALLOC` ops |
| Output | Total live bytes | `p2 × 10⁶ + \|p2 − p1\|` |
| Reuses Part 1 | — | ✅ Runs `part-1.js` as a subprocess |

---

## ▶️ How to Run

```bash
node part-1.js
node part-2.js
```

`input.txt` must be in the same folder as the scripts. Part 2 invokes `part-1.js`, so keep both files together.

---

## ✅ Results

| Part | Answer |
|------|--------|
| Part 1 | `13640242` |
| Part 2 | `1437966202288` |

---

## 🪲 Notes

- **Duplicate `REF` is a full no-op** — a second `REF src dst` must not increment `dst`'s count a second time, or objects will never be freed.
- **Cascading free is recursive** — freeing an object releases its outgoing references, so `freeObj` must recurse through newly-zeroed objects.
- **Reference cycles** — Part 1 can never free a cycle (each member keeps the other alive); Part 2's mark-and-sweep can. This is exactly why the drift `|p2 − p1|` is interesting.
- **`K` ticks on "effective" ops** — the counter advances on non-`ALLOC` operations; `ALLOC` never ticks. Follow the code's exact placement (`tickAndMaybeGC()` is called even when a `REF`/`DELREF` mutated nothing but the objects were alive).
- **BigInt for the combined answer** — `part2Size × 10⁶` exceeds 32-bit range; keep the accumulation in BigInt.
