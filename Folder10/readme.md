# Challenge 10 — Relay Network Calibration 📡

## 📖 Story
Word has spread fast across the planet: the genetic tracking system, the therapy terminal, the translation infrastructure. Now the scope is cosmic. Adel and the crew have reached their final destination, collected the scientific data Earth has been waiting for, and are preparing to transmit it home. But Ramadan is almost over — mission control needs this data before the holiday ends.

The communication network between the ship and Earth is a massive web of directed relay stations. Signals can only travel one way through each link, and each link has a transmission cost. The network is organized into tightly connected relay clusters, chained together across deep space.

Adel must first find the cheapest feedback loop in the system to calibrate the signal. Then he needs to decompose the entire network into its relay clusters and find the longest chain through them to maximize signal strength. Every wasted cycle means the data might not arrive before Eid.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Find minimum weight directed cycle after at most one edge reversal |
| `part2.js` | Decompose into SCCs, find longest relay chain, sum SCC weights |
| `input.txt` | N M header, then M directed weighted edges |

---

## 📥 Input Format

```
6 8
0 1 5
1 2 5
2 0 50
0 2 20
3 4 4
4 5 4
5 3 40
1 3 1
```

- **Line 1:** `N M` — number of nodes and edges
- **Lines 2 to M+1:** `A B W` — directed edge from node A to node B with weight W
- Nodes are labeled `0` to `N-1`. All weights are positive integers.

---

## Part 1 — Minimum Cycle After At Most One Reversal

### 🎯 Goal
You may reverse **at most one edge** in the graph (replacing `A→B` with `B→A`, keeping weight W, removing the original). Find the **minimum total weight** of any directed cycle in the resulting graph.

### 📌 Example Walkthrough

**Step 1: Cycles without any reversal**

| Cycle | Weight |
|-------|--------|
| 0→1→2→0 | 5+5+50 = 60 |
| 0→2→0 | 20+50 = 70 |
| 3→4→5→3 | 4+4+40 = 48 |

Minimum without reversal: **48**

**Step 2: Cycles with one reversal**

For each edge `A→B(W)`, reverse it to `B→A(W)` and check if a path from `A` to `B` exists using the remaining edges. Cycle weight = W + path(A→B).

| Reversed edge | Path needed | Path exists? | Cycle weight |
|---------------|-------------|--------------|--------------|
| 0→1(5) | 0 to 1 without 0→1 | ✗ | — |
| 1→2(5) | 1 to 2 without 1→2 | ✗ | — |
| 2→0(50) | 2 to 0 without 2→0 | ✗ | — |
| **0→2(20)** | **0 to 2 without 0→2** | **✓ via 0→1→2 = 10** | **20+10 = 30** |
| 3→4(4) | 3 to 4 without 3→4 | ✗ | — |
| 4→5(4) | 4 to 5 without 4→5 | ✗ | — |
| 5→3(40) | 5 to 3 without 5→3 | ✗ | — |
| 1→3(1) | 1 to 3 without 1→3 | ✗ | — |

**Step 3: Overall minimum**

`min(48, 30) = 30`

### 💡 Approach

**Without reversal:** For each edge `A→B(W)`, run Dijkstra from `B` and check `dist[A]`. Also try skipping each edge and running Dijkstra from `A` to find `dist[B]`.

**With reversal:** For each edge `A→B(W)`, remove it from the graph, run Dijkstra from `A`, check `dist[B]`. Cycle = `W + dist[B]`.

```js
// Cycle using existing edges (edge A->B contributes W, find path B->A)
for (const [a, b, w] of edges) {
    const dist = dijkstra(b, adj);
    if (dist[a] < INF) best = Math.min(best, w + dist[a]);
}

// Cycle using reversal (remove edge i, run from A, find path A->B)
for (let i = 0; i < edges.length; i++) {
    const [a, b, w] = edges[i];
    const dist = dijkstra(a, adj, skipEdgeIdx = i);
    if (dist[b] < INF) best = Math.min(best, w + dist[b]);
}
```

**Complexity:** O(M × (N + M) log N) — one Dijkstra per edge.

---

## Part 2 — Longest Relay Chain (SCC Decomposition)

### 🎯 Goal
Decompose the network into **Strongly Connected Components (SCCs)**, compute each SCC's minimum internal cycle weight, build the condensation DAG, find the **longest path** (maximum number of SCCs), and output the **sum of SCC weights** along that path.

### 📌 Example Walkthrough

**Step 1: Find SCCs**

| SCC | Nodes |
|-----|-------|
| SCC A | {0, 1, 2} |
| SCC B | {3, 4, 5} |

**Step 2: Compute SCC weights (minimum internal cycle)**

SCC A internal edges: `0→1(5), 1→2(5), 2→0(50), 0→2(20)`

| Cycle | Weight |
|-------|--------|
| 0→1→2→0 | 5+5+50 = 60 |
| 0→2→0 | 20+50 = 70 |

Minimum cycle in SCC A: **60**

SCC B internal edges: `3→4(4), 4→5(4), 5→3(40)`

| Cycle | Weight |
|-------|--------|
| 3→4→5→3 | 4+4+40 = 48 |

Minimum cycle in SCC B: **48**

**Step 3: Build condensation DAG**

Edge `1→3` crosses from SCC A to SCC B → `SCC A → SCC B`

**Step 4: Find the longest path**

| Path | Number of SCCs |
|------|---------------|
| SCC A alone | 1 |
| SCC B alone | 1 |
| SCC A → SCC B | **2** ✅ |

**Step 5: Sum of SCC weights**

`60 + 48 = 108`

### 💡 Approach

**SCCs** via Kosaraju's algorithm (two iterative DFS passes — avoids stack overflow on large inputs).

**Min cycle per SCC** via Dijkstra restricted to nodes within that SCC: for each source node in the SCC, expand neighbors first (do not set `dist[src]=0`), find shortest path returning to `src`.

**Condensation DAG** + **topological DP**: `dp[i] = [chainLength, totalWeight]`, maximize chain length first, then weight as tiebreaker.

```js
// Longest path DP in topological order
while (qi < queue.length) {
    const u = queue[qi++];
    for (const v of dagAdj[u]) {
        if (dp[u][0] > 0 && sccWeight[v] < INF) {
            const nc = dp[u][0] + 1, nw = dp[u][1] + sccWeight[v];
            if (nc > dp[v][0] || (nc === dp[v][0] && nw > dp[v][1]))
                dp[v] = [nc, nw];
        }
        if (--indegree[v] === 0) queue.push(v);
    }
}
```

**Complexity:** O(N + M) for SCCs + O(K × (N + M) log N) for SCC cycle weights (K = nodes per SCC) + O(N + M) for DAG DP.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Core operation | Min cycle with optional edge reversal | SCC decomposition + longest DAG path |
| Graph topology | Directed, weighted | Directed, weighted |
| Key algorithm | Dijkstra × M | Kosaraju + Dijkstra per SCC + topo DP |
| Output | Minimum cycle weight | Sum of SCC weights on longest chain |
| Reuses Part 1 | — | ✅ Same input parsing & MinHeap |

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
| Part 1 | `757` |
| Part 2 | `736275` |

---

## 🪲 Bugs / Notes

- **Iterative DFS in Kosaraju** — recursive DFS will hit JS call stack limits on large graphs. Both passes must be iterative; the first pass simulates post-order by tracking the index of the current neighbor being visited.
- **Min cycle via Dijkstra within SCC** — do NOT initialize `dist[src] = 0`. Instead, seed the heap with direct neighbors of `src` within the SCC, so you find the shortest path that *leaves and returns* rather than the trivial zero-cost stay.
- **Single-node SCCs** — a single node has no cycle unless it has a self-loop. Check for self-loops explicitly; otherwise `sccWeight` stays `INF` and correctly contributes 0 to the chain.
- **Condensation DAG deduplication** — multiple original edges can connect the same SCC pair. Use a `Set` per SCC to avoid duplicate DAG edges and double-counting indegrees.
- **Tie-break direction** — longest path wins on chain *length* first, then maximum *weight* sum as tiebreaker. Getting this backwards silently produces wrong answers on inputs with multiple equal-length chains.
- **Part 1 reversal logic** — when reversing edge `A→B`, the original edge is *removed*. Pass `skipEdgeIdx` to Dijkstra so the original direction isn't still usable during the path search from `A` to `B`.