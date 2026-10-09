const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const M = parseInt(lines[0]);
const MOD = 1000000009n;
const inv6 = modpow(6n, MOD - 2n, MOD);

function modpow(base, exp, mod) {
    let r = 1n; base = base % mod;
    while (exp > 0n) { if (exp & 1n) r = r * base % mod; base = base * base % mod; exp >>= 1n; }
    return r;
}

function sumSq(a, b) {
    const A = BigInt(a), B = BigInt(b);
    const s1 = B * (B + 1n) % MOD * (2n * B + 1n) % MOD * inv6 % MOD;
    const Am1 = ((A - 1n) % MOD + MOD) % MOD;
    const s0 = Am1 * A % MOD * ((2n * A - 1n + MOD) % MOD) % MOD * inv6 % MOD;
    return (s1 - s0 + MOD) % MOD;
}

function opEnergy(mode, x1, x2, y1, y2, z1, z2) {
    const Nx = BigInt(x2 - x1 + 1) % MOD, Ny = BigInt(y2 - y1 + 1) % MOD, Nz = BigInt(z2 - z1 + 1) % MOD;
    const Sx = sumSq(x1, x2), Sy = sumSq(y1, y2), Sz = sumSq(z1, z2);
    const base = (Sx * Ny % MOD * Nz % MOD + Sy * Nx % MOD * Nz % MOD + Sz * Nx % MOD * Ny % MOD) % MOD;
    return mode === 1 ? 4n * base % MOD : base;
}

let total = 0n;
for (let i = 1; i <= M; i++) {
    const parts = lines[i].split(' ');
    const mode = parseInt(parts[0]);
    const [xr, yr, zr] = parts[1].split(',');
    const parse = s => s.split('..').map(Number);
    const [x1, x2] = parse(xr), [y1, y2] = parse(yr), [z1, z2] = parse(zr);
    total = (total + opEnergy(mode, Math.min(x1, x2), Math.max(x1, x2),
        Math.min(y1, y2), Math.max(y1, y2),
        Math.min(z1, z2), Math.max(z1, z2))) % MOD;
}
console.log(total.toString());