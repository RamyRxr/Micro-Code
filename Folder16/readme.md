# Challenge 16 — Radiation Shield Calibration 🛡️

## 📖 Story
The letters from home were finally readable. Chorba frik recipes from mothers, photos of zlabia and kalb el louz fresh from the kitchen, voice notes from cousins wishing them Ramadan Mabrouk. The crew pinned printed messages on the cabin walls and someone taped a photo of a mawa'id ar-rahma table to the galley door. The last days of Ramadan had arrived, and through the viewport, the blue curve of Earth was growing larger every day.

But the homecoming was not guaranteed yet. The rocket's radiation shield generator needed a calibration cipher to arm. The generator used a pseudo-random number system driven by a 64-bit internal state evolving according to a linear congruential formula. Without a verification checksum and a long-range diagnostic state reading, the shields would not arm — and reentry would be fatal.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Run PCG for N steps, sum extracted top-16-bit values |
| `part2.js` | Compute generator state at step T (T up to 10¹⁸) using leap-ahead |
| `input.txt` | Single line: `S0 MULT INC N T P` |

---

## 📥 Input Format

```
7392142408732208350 8796093023223 2199023257957 14334 300323046467736761 1000027013
```

| Field | Description |
|-------|-------------|
| `S0` | Initial seed (64-bit unsigned integer) |
| `MULT` | LCG multiplier (odd 64-bit unsigned integer) |
| `INC` | LCG increment (odd 64-bit unsigned integer) |
| `N` | Step count for checksum (5,000–15,000) |
| `T` | Long-range diagnostic step index (up to 10¹⁸) |
| `P` | Diagnostic modulus (prime, ~10⁹) |

---

## Generator Structure

**Stage 1 — LCG state update:**
```
S(k) = (S(k-1) × MULT + INC) mod 2^64
```

**Stage 2 — PCG-XSH-RR output transformation (32-bit output):**
```
xorshifted = ((state >> 18) ^ state) >> 27
rot        = state >> 59
output     = (xorshifted >> rot) | (xorshifted << ((-rot) & 31))
```

**Top-16-bit extraction:**
```
value = output >> 16     (yields 0–65535)
```

---

## Part 1 — Verification Checksum

### 🎯 Goal
Run the generator for exactly `N` steps. At each step, apply the PCG-XSH-RR transformation and extract the top 16 bits. Output the sum of all `N` extracted values.

### ⚠️ Output Timing Trick
The problem describes a **pre-transition** convention:
> *"output_1 = PCG(S(0)), then S(0) → S(1)"*

This is **misdirection**. The example walkthrough proves the actual convention is **post-transition**:
- Advance the state first: `S(k) = MULT × S(k-1) + INC`
- Then apply PCG to the new state: `output_k = PCG(S(k))`

Verified against the example:

| Step | Output (32-bit) | Extracted (top 16) |
|------|-----------------|---------------------|
| 1 | 3782789370 | 57720 |
| 2 | 503438468 | 7681 |
| 3 | 3460728793 | 52806 |

These match only with post-transition ordering (advance state, then output).

### 💡 Approach

```js
function pcgOutput(state) {
  const xorshifted = BigInt.asUintN(32, ((state >> 18n) ^ state) >> 27n);
  const rot = Number(state >> 59n);
  return BigInt.asUintN(32,
    (xorshifted >> BigInt(rot)) | (xorshifted << BigInt((-rot) & 31))
  );
}

let state = S0;
let checksum = 0n;
for (let i = 0n; i < N; i++) {
  state = BigInt.asUintN(64, state * MULT + INC); // advance first
  checksum += pcgOutput(state) >> 16n;            // then output
}
```

**Complexity:** O(N) — straightforward iteration, N ≤ 15,000.

### 📌 Example

With N = 14334: **Answer: 474629084**

---

## Part 2 — Long-Range Diagnostic

### 🎯 Goal
Compute `S(T) mod P` where T can be up to 10¹⁸. Direct iteration is infeasible — use the **affine leap-ahead** technique to compute `S(T)` in O(log T) steps.

### ⚠️ Modular Arithmetic Trick
The problem devotes an entire paragraph to explaining why all intermediate arithmetic can be done **mod P**:
> *"The generator's native modulus 2⁶⁴ is irrelevant once the computation is projected into the prime field, because the affine structure is preserved under any modular reduction."*

This is **misdirection**. The LCG's mod 2⁶⁴ truncation at every step is not irrelevant — it fundamentally changes the sequence. Doing the leap-ahead mod P gives a completely wrong answer.

The correct approach: perform the entire leap-ahead in **mod 2⁶⁴** arithmetic (the LCG's native modulus), then reduce mod P only at the very end.

Verified: leap-ahead mod P gives `507126863` for the example. Leap-ahead mod 2⁶⁴ then mod P gives **`163010823`** — the correct answer.

### 💡 Approach

The LCG `S(k) = MULT × S(k-1) + INC` is an affine map `x → MULT×x + INC`. Composing it T times:
- Two affine maps `x→a×x+b` and `x→c×x+d` compose as `x→(ac)×x+(ad+b)`
- Repeated squaring lets us compute the T-fold composition in O(log T)

```js
function leapAhead(s0, mult, inc, T) {
  let accMult = 1n, accInc = 0n;
  let curMult = mult, curInc = inc;
  let t = T;
  while (t > 0n) {
    if (t & 1n) {
      // Compose accumulated map with current map — ALL mod 2^64
      accInc  = BigInt.asUintN(64, accMult * curInc + accInc);
      accMult = BigInt.asUintN(64, accMult * curMult);
    }
    // Square the current map
    curInc  = BigInt.asUintN(64, (curMult + 1n) * curInc);
    curMult = BigInt.asUintN(64, curMult * curMult);
    t >>= 1n;
  }
  return BigInt.asUintN(64, accMult * s0 + accInc);
}

const sT = leapAhead(S0, MULT, INC, T);
console.log((sT % P).toString()); // reduce mod P only at the end
```

**Complexity:** O(log T) ≈ 60 iterations for T up to 10¹⁸.

### 📌 Example

With T = 300323046467736761, P = 1000027013: **Answer: 163010823**

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Core operation | Iterate N steps, sum top-16 bits | Leap-ahead to step T, reduce mod P |
| Complexity | O(N) | O(log T) |
| Key trick | Pre-transition is misdirection → use post-transition | Mod P shortcut is misdirection → use mod 2⁶⁴ throughout |
| BigInt needed | Yes (64-bit state) | Yes (64-bit arithmetic) |

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
| Part 1 | `476890212` |
| Part 2 | `608310124` |

---

## 🪲 Bugs / Notes

- **Pre-transition is the trap (Part 1)** — the problem explicitly describes output as `PCG(S(k-1))` before the state advances. The example table proves the opposite: state advances first, then PCG is applied to the new state. Always verify step 1 against the walkthrough before trusting the description.
- **Mod P shortcut is the trap (Part 2)** — the problem argues at length that working entirely mod P is valid because "the affine structure is preserved under any modular reduction." This is false for an LCG with a fixed mod-2⁶⁴ truncation at every step. The leap-ahead must be done in mod-2⁶⁴ arithmetic; mod P is applied only once at the very end.
- **`BigInt.asUintN(64, ...)`** — use this instead of `% 2n**64n` for all 64-bit arithmetic. It handles unsigned overflow correctly and is significantly faster for large iteration counts.
- **`BigInt.asUintN(32, ...)`** — use this for the xorshifted intermediate in the PCG permutation to ensure it stays 32-bit before the rotation.
- **Leap-ahead squaring formula** — when squaring the affine map `x → a×x + b`, the new increment is `(a+1)×b` (not just `a×b + b`), since composing `x→ax+b` with itself gives `x→a²x + (a+1)b`. Easy to get wrong.
- **N is in parts[3], T in parts[4]** — don't mix them up when parsing the single input line.