<div align="center">

# ⚡ Micro-Code

### 20 micro-challenges. Two parts each. One goal — sharpen the craft.

[![Challenges](https://img.shields.io/badge/Challenges-20%2F20-blueviolet?style=for-the-badge)](#-challenge-index)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Python](https://img.shields.io/badge/Python-3.x-3776ab?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-5fa04e?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#-license)

*Algorithmic puzzle solutions written from scratch — a personal training ground for competitive programming.*

</div>

---

## 📖 About

**Micro-Code** is a collection of 20 self-contained algorithmic challenges, each split into **Part 1** and **Part 2**. Every challenge ships with its own input, a runnable solution, and a written walkthrough covering the idea, the algorithm, complexity, and the specific traps that make each part tricky.

The problems follow a continuous science-fiction narrative — a crew spending Ramadan in deep space — but the challenges themselves are pure algorithms: hash sets, graphs, dynamic programming, trees, hashing, simulation, minimax, generators, number theory, and optimization. Part 2 of each challenge almost always adds a twist that breaks the naive approach from Part 1.

No frameworks, no dependencies — just the language runtime and a text file.

---

## 🗂️ Repository Structure

```
Micro-Code/
├── README.md                 ← you are here
├── LICENSE
├── challenge-01/
│   ├── readme.md             ← problem, walkthrough, results, gotchas
│   ├── input.txt             ← the puzzle input
│   ├── part-1.js             ← Part 1 solution
│   └── part-2.js             ← Part 2 solution
├── challenge-02/
│   └── ...
└── challenge-20/
    └── ...
```

Every challenge folder follows the same shape:

| File | Purpose |
|------|---------|
| `readme.md` | Story, input format, approach, complexity, results, and bugs hit |
| `input.txt` | The challenge's own input |
| `part-1.js` | Part 1 solution |
| `part-2.js` | Part 2 solution |

> `challenge-19` also includes **Python** ports (`part-1.py`, `part-2.py`).

---

## 🚀 Quick Start

Requires **Node.js ≥ 18** (a few solutions use modern `BigInt`/`Int32Array` features). Python is only needed for `challenge-19`.

```bash
git clone https://github.com/RamyRxr/Micro-Code.git
cd Micro-Code

# run any part (it reads ./input.txt from its own folder)
node challenge-01/part-1.js
node challenge-01/part-2.js

# Python variant
python3 challenge-19/part-2.py challenge-19/input.txt
```

Each script reads `input.txt` **relative to its own directory**, so you can run it from anywhere.

---

## 🧭 Challenge Index

| # | Challenge | Core technique | Solutions |
|:--|:----------|:---------------|:---------:|
| 01 | [Crescent Lock](./challenge-01/readme.md) 🌙 | Hash set · two pointers | [P1](./challenge-01/part-1.js) · [P2](./challenge-01/part-2.js) |
| 02 | [Orbital Formula Parser](./challenge-02/readme.md) 🚀 | Recursive-descent parser | [P1](./challenge-02/part-1.js) · [P2](./challenge-02/part-2.js) |
| 03 | [Signal Stack](./challenge-03/readme.md) 📡 | Stack VM · 32-bit / BigInt | [P1](./challenge-03/part-1.js) · [P2](./challenge-03/part-2.js) |
| 04 | [Zero-G Kitchen Rotation](./challenge-04/readme.md) 🍽️ | Circular scheduling · cooldown | [P1](./challenge-04/part-1.js) · [P2](./challenge-04/part-2.js) |
| 05 | [Dead Star Calibration](./challenge-05/readme.md) 🌑 | Primality · sliding window | [P1](./challenge-05/part-1.js) · [P2](./challenge-05/part-2.js) |
| 06 | [Linguistic Roots](./challenge-06/readme.md) 🌳 | Tree DFS · LCA | [P1](./challenge-06/part-1.js) · [P2](./challenge-06/part-2.js) |
| 07 | [Genetic Drift Simulator](./challenge-07/readme.md) 🧬 | Simulation · bit tricks | [P1](./challenge-07/part-1.js) · [P2](./challenge-07/part-2.js) |
| 08 | [Terminal Mind](./challenge-08/readme.md) 🎮 | Minimax · game trees | [P1](./challenge-08/part-1.js) · [P2](./challenge-08/part-2.js) |
| 09 | [Patient Record Lookup](./challenge-09/readme.md) 🏥 | Grid search · toroidal distance | [P1](./challenge-09/part-1.js) · [P2](./challenge-09/part-2.js) |
| 10 | [Relay Network Calibration](./challenge-10/readme.md) 📡 | Dijkstra · SCC · DAG DP | [P1](./challenge-10/part-1.js) · [P2](./challenge-10/part-2.js) |
| 11 | [Starlight Array](./challenge-11/readme.md) ♕ | N-Queens · backtracking | [P1](./challenge-11/part-1.js) · [P2](./challenge-11/part-2.js) |
| 12 | [Memory Cleanup](./challenge-12/readme.md) 🧹 | Ref-counting vs mark-and-sweep | [P1](./challenge-12/part-1.js) · [P2](./challenge-12/part-2.js) |
| 13 | [Star Map Renderer](./challenge-13/readme.md) 🌌 | 3D union · coordinate sweep | [P1](./challenge-13/part-1.js) · [P2](./challenge-13/part-2.js) |
| 14 | [Conveyor Belt Iftar](./challenge-14/readme.md) 🚀 | Binary lifting | [P1](./challenge-14/part-1.js) · [P2](./challenge-14/part-2.js) |
| 15 | [Scrambled Messages](./challenge-15/readme.md) 📡 | Manacher · Fenwick hashing | [P1](./challenge-15/part-1.js) · [P2](./challenge-15/part-2.js) |
| 16 | [Radiation Shield Calibration](./challenge-16/readme.md) 🛡️ | PCG generator · affine leap-ahead | [P1](./challenge-16/part-1.js) · [P2](./challenge-16/part-2.js) |
| 17 | [Relay Chain Keypad](./challenge-17/readme.md) 🚀 | BFS paths · memoized expansion | [P1](./challenge-17/part-1.js) · [P2](./challenge-17/part-2.js) |
| 18 | [Thermal Tile Partitioning](./challenge-18/readme.md) 🚀 | DP partition · prefix sums | [P1](./challenge-18/part-1.js) · [P2](./challenge-18/part-2.js) |
| 19 | [Guidance Logic Repair](./challenge-19/readme.md) 🔌 | Logic-gate search · fix-sets | [P1](./challenge-19/part-1.js) · [P2](./challenge-19/part-2.js) · [.py](./challenge-19/part-1.py) |
| 20 | [Cargo Bid Optimizer](./challenge-20/readme.md) 📦 | Branch-and-bound · live queries | [P1](./challenge-20/part-1.js) · [P2](./challenge-20/part-2.js) |

**All 20 challenges are complete** (Part 1 ✅ and Part 2 ✅).

---

## 🧠 Techniques Covered

`hash maps` · `sorting` · `two pointers` · `recursive descent` · `stacks` · `BigInt / 32-bit arithmetic` · `tree DFS` · `LCA` · `minimax` · `word search` · `Dijkstra` · `SCC (Kosaraju)` · `topological DP` · `backtracking` · `N-Queens` · `garbage collection` · `coordinate compression` · `sweep line` · `binary lifting` · `Manacher` · `Fenwick trees` · `polynomial hashing` · `LCG / PCG` · `affine leap-ahead` · `BFS` · `memoization` · `dynamic programming` · `branch and bound`

---

## 📐 Conventions

- **Clarity first, performance second.** Solutions favour readable structure, then optimise where the constraints demand it.
- **No external dependencies.** Standard library and language built-ins only.
- **`input.txt` lives beside the solution** and is resolved via `__dirname` (JS) so scripts run from anywhere.
- **`BigInt` where it matters.** Several challenges (03, 13, 14, 16, 17, 19, 20) exceed 32/53-bit ranges; those solutions use `BigInt` deliberately.
- **Each `readme.md` ends with the bug/edge-case notes** that actually cost time — the interesting part.

---

## 📊 Progress

```
Challenges completed: 20 / 20
████████████████████ 100%
```

---

## 📄 License

Released under the [MIT License](./LICENSE). Use it, learn from it, fork it.

---

<div align="center">

**Built by [RamyRxr](https://github.com/RamyRxr)**

*One challenge at a time.* 💪

</div>
