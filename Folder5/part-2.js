const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "input.txt"), "utf8").replace(/\r/g, "").split("\n");

// --- Step 1: Parse & filter stable signals (same as Part 1) ---
const stable = [];
for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*(-?\d+)\s*\|\s*([A-Z])\s*:\s*([A-Z])\s*$/);
    if (!match) continue;
    const [, val, modeS, modeR] = match;
    if (modeS === modeR) stable.push(parseInt(val, 10));
}

// --- Step 2: Build bit sequence ---
function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
    return true;
}

const bits = [];
for (const v of stable) {
    const abs = Math.abs(v);
    if (abs === 0) continue;
    bits.push(isPrime(abs) ? 1 : 0);
}

const N = bits.length;

// --- Step 3: Sliding window mutation (length N-4) ---
const mutated = [];
for (let i = 0; i <= N - 5; i++) {
    const [b0, b1, b2, b3, b4] = [bits[i], bits[i + 1], bits[i + 2], bits[i + 3], bits[i + 4]];
    const W = b0 * 16 + b1 * 8 + b2 * 4 + b3 * 2 + b4;
    if (W % 3 === 0) mutated.push(1);
    else if (W % 5 === 0) mutated.push(0);
    else mutated.push((b0 + b1 + b2 + b3 + b4) % 2);
}

const M = mutated;
const ML = M.length;

// --- Step 4: Find smallest period L that divides ML ---
function isPeriod(L) {
    for (let i = 0; i < ML; i++) {
        if (M[i] !== M[i % L]) return false;
    }
    return true;
}

let L = 1;
for (; L <= ML; L++) {
    if (ML % L === 0 && isPeriod(L)) break;
}

// --- Step 5: Position sum × L ---
let posSum = 0;
for (let i = 0; i < ML; i++) {
    if (M[i] === 1) posSum += i + 1;
}

console.log(posSum * L);