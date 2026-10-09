const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").split("\n");


// Step 1: Parse and filter stable signals (MODE_S == MODE_R), skip blanks
const stable = [];
for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*(-?\d+)\s*\|\s*([A-Z])\s*:\s*([A-Z])\s*$/);
    if (!match) continue;
    const [, val, modeS, modeR] = match;
    if (modeS === modeR) stable.push(parseInt(val, 10));
}

const S = stable.length;

// Step 2: Build bit sequence — discard zeros, prime→1, non-prime→0
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

// Step 3: Compute Power Index
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

const shift = S % 7;
let power = 0;

for (let i = 1; i <= N; i++) {
    const E = ((i + shift - 1) % N) + 1;
    if (bits[i - 1] === 1) {
        power += E * E;
    } else {
        power -= gcd(E, N);
    }
}

console.log(power);