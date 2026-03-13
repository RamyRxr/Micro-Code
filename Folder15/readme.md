# Challenge 15 — Scrambled Messages 📡

## 📖 Story
With the conveyor belts sorted and iftar packets reaching every compartment on schedule, the crew settled into the quiet rhythm of Ramadan in deep space. That evening, the communication relay crackled to life — messages from family back on Earth. Chorba frik recipes, photos of zlabia and kalb el louz, voice notes wishing them Ramadan Mabrouk. But every message was garbled, scrambled by a cipher that chained each decoded answer into the key for the next. The relay's decryption firmware was only half functional. Until every fragment was decoded in order, the letters from home would remain unreadable.

---

## 📁 Files

| File | Description |
|------|-------------|
| `part1.js` | Static palindrome range queries with online decoding, rolling checksum |
| `part2.js` | Same + dynamic string mutations and floating K, rolling checksum |
| `input.txt` | N Q K, string S, then Q query lines |

---

## 📥 Input Format

```
5 4 3
aabaa
2 4
1 5
3 3
4 2
```

- **Line 1:** `N Q K` — string length, query count, initial shift constant (K is a large prime)
- **Line 2:** String `S` of length `N` (lowercase letters, 1-indexed)
- **Lines 3 to Q+2:** Each line has two integers `Ai Bi` — encrypted endpoints

---

## Shared Query Processing (Both Parts)

### Step 1 — Decode endpoints
```
key   = LastAns × K          (LastAns = 1 if previous was palindrome, else 0)
L_raw = Ai XOR key
R_raw = Bi XOR key
L     = min(L_raw, R_raw), clamped to [1, N]
R     = max(L_raw, R_raw), clamped to [1, N]
```

### Step 2 — Optional shrink
If `(L + R)` is divisible by 3:
```
span = R - L
L    = L + floor(span / 4)
R    = R - floor(span / 4)
```

### Step 3 — Palindrome check
Check whether `S[L..R]` (1-indexed, inclusive) is a palindrome.

### Checksum
```
Checksum = sum of (ans_i × 31^i) mod (10^9 + 9)    for i = 1 to Q
```
Only palindrome queries contribute (ans_i = 1).

---

## Part 1 — Static String

### 🎯 Goal
The string never changes. Answer all Q palindrome range queries with online decoding and compute the rolling checksum.

### ⚠️ Mod N Reduction Trick
The problem includes a note suggesting the XOR key should be reduced modulo N before application:
> *"key = (LastAns × K) % N ... Without this reduction, when K exceeds N, the decoded coordinates land far outside the valid range"*

Then immediately contradicts itself:
> *"XOR key is simply LastAns × K with no reduction"*

The **correct formula is no mod N reduction** — use `key = LastAns × K` directly, then clamp to `[1, N]`. The mod N suggestion is the misdirection.

### 💡 Approach

**Manacher's algorithm** — O(N) preprocessing, O(1) palindrome queries.

Transform `S` into `#a#b#c#...#` (length `2N+1`) to unify odd and even length palindromes. Build the radius array `p[]`. Then `S[L..R]` is a palindrome iff `p[L+R] >= R-L+1` (using transformed indices).

```js
function buildManacher(s) {
  const t = '#' + s.split('').join('#') + '#';
  const p = new Array(t.length).fill(0);
  let c = 0, r = 0;
  for (let i = 0; i < t.length; i++) {
    if (i < r) p[i] = Math.min(r - i, p[2*c - i]);
    while (i-p[i]-1>=0 && i+p[i]+1<t.length && t[i-p[i]-1]===t[i+p[i]+1]) p[i]++;
    if (i + p[i] > r) { c = i; r = i + p[i]; }
  }
  return p;
}

// S[l..r] (0-indexed) is palindrome iff:
function isPalindrome(p, l, r) {
  return p[l + r + 1] >= r - l + 1; // center in transformed = l+r+1
}
```

**Complexity:** O(N + Q)

### 📌 Example

| Query | L | R | S[L..R] | Palindrome | ans |
|-------|---|---|---------|------------|-----|
| 1 | 2 | 4 | aba | ✅ | 1 |
| 2 | 2 | 5 | abaa | ❌ | 0 |
| 3 | 3 | 3 | b | ✅ | 1 |
| 4 | 2 | 4 | aba | ✅ | 1 |

Checksum = 31¹ + 31³ + 31⁴ = 31 + 29791 + 923521 = **953343**

---

## Part 2 — Dynamic String with Mutations and Floating K

### 🎯 Goal
Same decoding, same shrinking, same checksum. Three things change:

**1. String mutations after each query:**
- If palindrome: `S[L]` advances one letter (`a→b`, ..., `z→a`)
- If not palindrome: `S[R]` retreats one letter (`b→a`, ..., `a→z`)

**2. K updates every 1,000 queries:**
```
p = smallest prime strictly greater than (palindrome count in last 1000 queries)
K = (K × p) mod (10^9 + 7)
```

**3. The modulus trick for K updates:**
The problem states `K = (K × p) mod (10^9 + 7)`, then adds a long "Note" arguing this is a legacy value and you should use `10^9 + 9` instead for consistency. This elaborate explanation is **misdirection** — use the **original `10^9 + 7`** for K updates. The checksum still uses `10^9 + 9`.

### 💡 Approach

Manacher's is useless with mutations (static preprocessing). Need **dynamic palindrome queries with point updates**.

**Double polynomial hashing with two Fenwick trees per direction:**

For each hash base `B`:
- Forward Fenwick: stores `S[i] × B^i`, gives `hash(L..R) = fw.range(L,R) × B^(-L)`
- Backward Fenwick: stores `S[i] × B^(N+1-i)`, gives `hashRev(L..R) = bw.range(L,R) × B^(-(N+1-R))`

`S[L..R]` is a palindrome iff `hash(L..R) == hashRev(L..R)` for **both** bases (double hash to prevent collisions).

Point update on position `i`: compute delta, add `delta × B^i` to forward and `delta × B^(N+1-i)` to backward.

```js
function isPalin(l, r) {
  return mulmod(fw1.range(l,r), ipw1[l], MOD) === mulmod(bw1.range(l,r), ipw1[N+1-r], MOD)
      && mulmod(fw2.range(l,r), ipw2[l], MOD) === mulmod(bw2.range(l,r), ipw2[N+1-r], MOD);
}
function updateChar(i, newChar) {
  const delta = (newChar.charCodeAt(0) - S_arr[i-1].charCodeAt(0) + MOD) % MOD;
  fw1.update(i, mulmod(delta, pw1[i], MOD));
  bw1.update(i, mulmod(delta, pw1[N+1-i], MOD));
  // same for fw2, bw2
  S_arr[i-1] = newChar;
}
```

**Complexity:** O((N + Q) log N) — O(log N) per query and per mutation.

**Performance note:** Use `Number` arithmetic throughout the Fenwick trees (values fit in 32-bit). Only use `BigInt` for the final multiply-mod in `isPalin` and for K/checksum bookkeeping. This is critical for handling Q = 10⁶ within time limits.

### 📌 Example

| Query | L | R | S[L..R] | Palindrome | Mutation | S after |
|-------|---|---|---------|------------|----------|---------|
| 1 | 2 | 4 | aba | ✅ | S[2]: a→b | abbaa |
| 2 | 2 | 5 | bbaa | ❌ | S[5]: a→z | abbaz |
| 3 | 3 | 3 | b | ✅ | S[3]: b→c | abcaz |
| 4 | 2 | 4 | bca | ❌ | S[4]: a→z | abczz |

Checksum = 31¹ + 31³ = 31 + 29791 = **29822**

Note: Query 4 is NOT a palindrome in Part 2 (was in Part 1) because the mutation in Query 1 changed `S[2]` from `a` to `b`, breaking `aba`.

---

## Part 1 vs Part 2

| | Part 1 | Part 2 |
|---|---|---|
| String | Static | Dynamic (mutates after each query) |
| K | Fixed throughout | Updates every 1000 queries |
| Palindrome check | O(1) with Manacher | O(log N) with double Fenwick hash |
| K update modulus | N/A | `10^9 + 7` (not `10^9 + 9` — that's the trick) |
| XOR key | `LastAns × K` (no mod N) | Same |
| Checksum modulus | `10^9 + 9` | `10^9 + 9` |

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
| Part 1 | `32225451` |
| Part 2 | `789755442` |

---

## 🪲 Bugs / Notes

- **Mod N reduction is a trap (both parts)** — the problem suggests reducing the XOR key modulo N when K is large, to "preserve meaningful coordinate information." The next sentence contradicts this. Use raw `key = LastAns × K` and clamp to `[1, N]` after XOR.
- **K update uses `10^9 + 7`, not `10^9 + 9` (Part 2)** — the elaborate "Note on K update modulus" explaining why you should use `10^9 + 9` for consistency is misdirection. Use the originally stated `10^9 + 7`.
- **Manacher center formula** — for 0-indexed `[l, r]` on the original string, the center in the transformed `#a#b#...` string is `l + r + 1` and the required radius is `r - l + 1`. Off-by-one here gives wrong palindrome results.
- **Double hash required** — a single polynomial hash mod `10^9 + 9` has ~`Q/MOD ≈ 10^-3` expected collisions over `10^6` queries, which may corrupt the answer. Use two independent bases (e.g. 131 and 137) for reliable results.
- **Number vs BigInt in Fenwick** — Fenwick tree values are always < `10^9 + 9` (< 2³⁰), so all tree operations stay in safe Number range. Only `mulmod(a, b, MOD)` (where both inputs < MOD) needs BigInt promotion, since the product can reach ~`10^18 > 2^53`. Use `Number(BigInt(a) * BigInt(b) % BigInt(mod))` for these multiplications only.
- **Backward hash normalization** — `hashRev(L..R) = bw.range(L,R) × BASE^(-(N+1-R))`. The exponent is `N+1-R`, not `N-R` or `R`. Getting this wrong makes all backward hashes incorrect.
- **1-indexed throughout** — string positions, Fenwick updates, and Manacher queries are all 1-indexed. The `S_arr` array is 0-indexed internally; be careful at the boundary.
- **`nextPrime` performance** — palindrome counts per 1000 queries are at most 1000, so `nextPrime(n)` for `n ≤ 1000` only needs to check small candidates. A simple trial-division loop is fast enough here.