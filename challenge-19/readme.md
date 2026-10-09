# Challenge 19 — Guidance Logic Repair 🔌

<!-- nav -->
<p align="center"><a href="../challenge-18/readme.md">⬅ Challenge 18</a> &nbsp;·&nbsp; <a href="../README.md">🏠 Index</a> &nbsp;·&nbsp; <a href="../challenge-20/readme.md">Challenge 20 ➡</a></p>

## 📖 Story
The thermal shield held, but the descent knocked the landing computer's combinational logic out of sync. The guidance module is a mesh of logic gates (`AND`, `OR`, `XOR`, `NAND`, `NOR`, `XNOR`) whose outputs no longer match the expected landing vector. Replacing a gate is expensive and slow, so the crew needs the **cheapest possible repair** — ideally changing a single gate type, and only if forced, two. Adel traces the circuit's wiring and starts simulating.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part-1.js` | Simulate the circuit, encode the output vector as a binary number |
| `part-2.js` | Find the minimal gate-type repair (1 or 2 changes), optimized |
| `part1.py` | Reference BFS repair (explores any number of changes) |
| `part2.py` | Python port of the optimized repair |
| `input.txt` | `I G`, input values, `G` gate lines, then the target outputs |

---

## 📥 Input Format

```
22 4008
0 0 0 1 1 1 1 0 1 1 ...
AND 3 10 22
OR 3 9 23
NOR 20 16 25
...
1 1 0 1 0 1 1 0 ...
```

- **Line 1:** `I G` — number of circuit inputs and gates
- **Line 2:** `I` input bit values
- **Next `G` lines:** `TYPE in1 in2 out` — a gate reading wires `in1`, `in2` and driving wire `out`
- **Last line:** the target output vector (`K` bits). The circuit's `K` output wires are the **last `K` gates' outputs**.

---

## Part 1 — Circuit Simulation

### 🎯 Goal
Run the gates in order and encode the `K` output bits as a binary integer:

```
O₁·2^(K−1) + O₂·2^(K−2) + … + O_K·2⁰
```

### 💡 Approach

```js
function gateOut(gtype, a, b) {
  switch (gtype) {
    case 'AND':  return a & b;
    case 'OR':   return a | b;
    case 'XOR':  return a ^ b;
    case 'NAND': return (a === 1 && b === 1) ? 0 : 1;
    case 'NOR':  return (a | b) === 0 ? 1 : 0;
    case 'XNOR': return a === b ? 1 : 0;
  }
}
```

Wires are evaluated in the given order (the input is topologically sorted), so a single forward pass is enough.

**Complexity:** O(G).

---

## Part 2 — Minimal Repair

### 🎯 Goal
Change as few gate **types** as possible so the circuit's output equals the target. Output:

```
0                                  if the circuit is already correct
1,000,000 + gate_index             if a single change suffices (lowest index wins)
2,000,000 + (idx1 + idx2)          if two changes are needed (lowest sum wins)
```

### 💡 Approach
Resimulate only from the changed gate onward (wires before it are unchanged):

1. **Single-change pass** — try every gate × every other type; first exact match wins → `1,000,000 + idx`.
2. **Two-change pass** — for each gate, record the set of **mismatch positions it can fix without breaking an already-correct position** (`beneficial`). Then find the pair of beneficial gates whose fixed-sets **cover every mismatch**, minimizing `idx1 + idx2` → `2,000,000 + sum`.

This "fix-sets cover the mismatch set" trick avoids the O(G²·types²) brute force of trying every pair directly.

**Complexity:** O(G² · types) resimulations, each O(G) from the changed gate — practical for G in the thousands.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Purpose | Evaluate the circuit | Repair the circuit |
| Output | Encoded output bits | Repair signature (changes + indices) |
| Search | None — single pass | Single-change, then fix-set pair search |
| Languages | `part-1.js`, `part-1.py` | `part-2.js`, `part-2.py` |

---

## ▶️ How to Run

```bash
# JavaScript
node part-1.js
node part-2.js

# Python
python3 part-1.py input.txt
python3 part-2.py input.txt
```

The `.js` files read `input.txt` from the same folder automatically. `part-2.py`
expects a path argument (or run it from inside the folder).

---

## ✅ Results

| Solution | Answer |
|----------|--------|
| `part-1.js` / `part-1.py` | `7381225487435` |
| `part-2.js` / `part-2.py` | `2007999` |

`2007999 = 2,000,000 + 7999` — the cheapest repair needs **two** gate changes whose indices sum to `7999`.

---

## 🪲 Bugs / Notes

- **Gate types are the only editable thing** — wiring and inputs are fixed; only `TYPE` may change.
- **Output wires are the last `K` gates** — `K` is the length of the target line, and the outputs are the final `K` gate output wire ids, not any fixed range.
- **"Without breaking" matters for the pair search** — a change that fixes one bit but breaks another is discarded (`beneficial`). Otherwise the union-cover check would accept bad changes.
- **Tie-breaks are on index, not wire id** — `part-2.js`/`part-2.py` sum **gate indices**. The reference `part-1.py` instead sums output **wire ids**, so its signature differs on ties.
- **`part-1.py` is exponential** — it BFS-searches any number of changes and is kept only as a reference; the optimized solver lives in `part-2`.
