# Challenge 03 — Signal Stack 📡

## 📖 Story
It's Adel's turn to cook iftar, and he has no idea what to make. Back home he'd just pull up Oum Walid's legendary recipe channel — but the signal is gone. The communication engineer delivers the bad news: the signal processing unit has crashed. All that remains is a raw instruction log from the last working session. The unit runs on a **stack-based architecture operating on 32-bit unsigned integers**. Replay the instructions, extract the output, and the signal comes back online. Iftar is in a few hours. Time to process that stack.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Execute the instruction log and XOR-reduce the final stack |
| `part2.js` | Same execution with dynamic reactions after every binary op |
| `input.txt` | Puzzle input (one instruction per line) |

---

## 📥 Input Format

One instruction per line:

```
push 10
push 20
xor
push 5
sub
```

---

## 🔧 Instruction Set

| Instruction | Description |
|-------------|-------------|
| `push V` | Push value `V` onto the stack |
| `pop` | Remove the top element |
| `dup` | Duplicate the top element |
| `dup2` | `[... A B]` → `[... A B A B]` |
| `dup3` | `[... A B C]` → `[... A B C A B C]` |
| `rol N` | `[... A B C D]` with N=4 → `[... D A B C]` (top rotates to bottom of slice) |
| `xor` | Pop B (top), A (below) → push `A XOR B` |
| `or` | Pop B (top), A (below) → push `A OR B` |
| `and` | Pop B (top), A (below) → push `A AND B` |
| `sub` | Pop B (top), A (below) → push `A - B` |
| `sum` | Pop B (top), A (below) → push `A + B` |
| `inc` | Increment top by 1 |
| `dec` | Decrement top by 1 |
| `not` | Pop A → push `NOT A` (bitwise, 32-bit) |
| `shl` | Pop B (top), A (below) → push `A << B` |
| `shr` | Pop B (top), A (below) → push `A >>> B` (unsigned) |

> For all binary ops — B is always popped first (top), A second (below).

---

## 🧱 Shared Foundation

### Why BigInt?
JavaScript's `number` type is a 64-bit float. Bitwise ops internally cast to **signed 32-bit**, which breaks large values like `4023233417` and makes `~0` return `-1` instead of `4294967295`. Every value is stored as `BigInt` for exact math.

### The `u32` helper
```js
const u32 = (n) => ((BigInt(n) % MOD) + MOD) % MOD;
```
Keeps every value in the unsigned 32-bit range `[0, 2³²−1]`. The `+ MOD) % MOD` part handles underflow — so `−1` wraps correctly to `4294967295`.

---

## Part 1 — Raw Execution

### 🎯 Goal
Execute all instructions on an initially empty stack. XOR-reduce the final stack and output the result.

```
Output = V1 XOR V2 XOR ... XOR Vk
```

### 📌 Example

```
push 10   → [10]
push 20   → [10, 20]
xor       → B=20, A=10 → 10^20=30    → [30]
push 5    → [30, 5]
sub       → B=5,  A=30 → 30-5=25     → [25]

XOR-reduce: 25
```

### 💡 Key implementation notes

**`rol N`** — pulls the top N elements off, moves the very top to the front of the slice:
```js
const slice = stack.splice(-n);  // e.g. [A, B, C, D]
slice.unshift(slice.pop());      // D moves to front → [D, A, B, C]
stack.push(...slice);
```

**`not`** — requires `BigInt.asUintN` because `~` on a BigInt returns a negative BigInt:
```js
stack.push(u32(BigInt.asUintN(32, ~stack.pop())));
// ~0n = -1n → asUintN(32) → 4294967295n ✓
```

**`shr`** — unsigned right shift (no sign extension):
```js
u32(BigInt.asUintN(32, A) >> (B & 31n))
```

**Shift masking** — `B & 31n` caps the shift amount at 31, since shifting 32+ bits is undefined in 32-bit arithmetic.

---

## Part 2 — Dynamic Reactions

### 🎯 Goal
Same execution, but after **every binary operation** result is pushed, inspect the top value `T` and react:

```
1. If bit 31 of T is set  → reverse the entire stack
2. Else if bit 0 of T is set → set reverseFlag for the next binary op
```

The two checks are **mutually exclusive** — if MSB fires, LSB is skipped.  
The `reverseFlag` is **consumed after one use**.

### 📌 Example

```
push 10   → [10]
push 20   → [10, 20]
xor       → flag=false → B=20, A=10 → 30 → [30]
              T=30 (0b11110): bit31=0, bit0=0 → nothing
push 5    → [30, 5]
sub       → flag=false → B=5, A=30 → 25 → [25]
              T=25 (0b11001): bit31=0, bit0=1 → reverseFlag=true
              (flag set but no more ops — never consumed)

XOR-reduce: 25
```

### 💡 Key implementation notes

**`react(T)`** — fires after every binary op:
```js
const react = (T) => {
  if ((T >> 31n) & 1n) stack.reverse();  // MSB: reverse whole stack
  else if (T & 1n) reverseFlag = true;   // LSB: flag next binary op
};
```

**`popAB()`** — respects the flag when consuming operands:
```js
const popAB = () => {
  if (reverseFlag) {
    reverseFlag = false;
    const A = stack.pop(), B = stack.pop();
    return [A, B]; // swapped — A is now what was on top
  }
  const B = stack.pop(), A = stack.pop();
  return [A, B];
};
```
When the flag is set, A and B swap positions. The caller still computes `A - B` for `sub`, but since the positions are reversed, it effectively computes what would normally be `B - A`.

**`binop()` helper** — eliminates repetition across all 7 binary ops:
```js
const binop = (fn) => { const [A, B] = popAB(), r = fn(A, B); stack.push(r); react(r); };

case "sub": binop((A, B) => u32(A - B)); break;
case "xor": binop((A, B) => u32(A ^ B)); break;
```

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| Operand popping | Simple B then A | `popAB()` — flag-aware |
| After result push | Nothing | `react()` — reverse or set flag |
| Extra state | None | `reverseFlag` boolean |

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
| Part 1 | `1340610512` |
| Part 2 | `4098405686` |

---

## 🪲 Bugs / Notes

- **BigInt is mandatory** — using regular JS numbers breaks `not`, `shr`, and any value above `2^31`. Silent wrong answers, no errors.
- **`~` on BigInt returns negative** — must wrap with `BigInt.asUintN(32, ~x)` before passing to `u32`.
- **`reverseFlag` is consumed before popping** — if you forget to reset the flag before the pops, re-entrant edge cases can double-consume it.
- **`rol` direction** — the top element moves to the *bottom* of the N-slice, not the other way around. Easy to get backwards.