const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [N, Q, Kraw] = lines[0].split(' ').map(Number);
let K = BigInt(Kraw);
const S_arr = lines[1].split('');
const MOD = 1000000009;
const MODn = 1000000009n;
const KMODn = 1000000007n; 
const BASE1 = 131, BASE2 = 137; 
const MAXN = N + 2;

function mulmod(a, b, mod) {
    return Number(BigInt(a) * BigInt(b) % BigInt(mod));
}
function modpow(base, exp, mod) {
    let r = 1n, b = BigInt(base) % BigInt(mod), e = BigInt(exp);
    while (e > 0n) { if (e & 1n) r = r * b % BigInt(mod); b = b * b % BigInt(mod); e >>= 1n; }
    return Number(r);
}

const pw1 = new Int32Array(MAXN), ipw1 = new Int32Array(MAXN);
const pw2 = new Int32Array(MAXN), ipw2 = new Int32Array(MAXN);
pw1[0] = pw2[0] = ipw1[0] = ipw2[0] = 1;
const inv1 = modpow(BASE1, MOD - 2, MOD), inv2 = modpow(BASE2, MOD - 2, MOD);
for (let i = 1; i < MAXN; i++) {
    pw1[i] = mulmod(pw1[i - 1], BASE1, MOD); pw2[i] = mulmod(pw2[i - 1], BASE2, MOD);
    ipw1[i] = mulmod(ipw1[i - 1], inv1, MOD); ipw2[i] = mulmod(ipw2[i - 1], inv2, MOD);
}

class FenwickNum {
    constructor(n) { this.n = n; this.tree = new Int32Array(n + 2); }
    update(i, d) { d = ((d % MOD) + MOD) % MOD; for (; i <= this.n; i += i & (-i))this.tree[i] = (this.tree[i] + d) % MOD; }
    query(i) { let s = 0; for (; i > 0; i -= i & (-i))s = (s + this.tree[i]) % MOD; return s; }
    range(l, r) { return (this.query(r) - this.query(l - 1) + MOD) % MOD; }
}

const fw1 = new FenwickNum(N), bw1 = new FenwickNum(N);
const fw2 = new FenwickNum(N), bw2 = new FenwickNum(N);
for (let i = 1; i <= N; i++) {
    const c = S_arr[i - 1].charCodeAt(0) - 96;
    fw1.update(i, mulmod(c, pw1[i], MOD)); bw1.update(i, mulmod(c, pw1[N + 1 - i], MOD));
    fw2.update(i, mulmod(c, pw2[i], MOD)); bw2.update(i, mulmod(c, pw2[N + 1 - i], MOD));
}

function isPalin(l, r) {
    return mulmod(fw1.range(l, r), ipw1[l], MOD) === mulmod(bw1.range(l, r), ipw1[N + 1 - r], MOD)
        && mulmod(fw2.range(l, r), ipw2[l], MOD) === mulmod(bw2.range(l, r), ipw2[N + 1 - r], MOD);
}
function updateChar(i, ch) {
    const d = (ch.charCodeAt(0) - S_arr[i - 1].charCodeAt(0) + MOD) % MOD;
    fw1.update(i, mulmod(d, pw1[i], MOD)); bw1.update(i, mulmod(d, pw1[N + 1 - i], MOD));
    fw2.update(i, mulmod(d, pw2[i], MOD)); bw2.update(i, mulmod(d, pw2[N + 1 - i], MOD));
    S_arr[i - 1] = ch;
}

function nextPrime(n) { let c = n + 1; while (!isp(c)) c++; return c; }
function isp(n) {
    if (n < 2) return false; if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6)if (n % i === 0 || n % (i + 2) === 0) return false;
    return true;
}

const pow31 = new BigInt64Array(Q + 1);
pow31[0] = 1n;
for (let i = 1; i <= Q; i++) pow31[i] = pow31[i - 1] * 31n % MODn;

let lastAns = 0n, checksum = 0n, palCount = 0;

for (let i = 0; i < Q; i++) {
    const p = lines[2 + i].split(' ');
    const A = BigInt(p[0]), B = BigInt(p[1]);
    const key = lastAns * K;
    const Lr = A ^ key, Rr = B ^ key;
    let L = Number(Lr < Rr ? Lr : Rr), R = Number(Lr < Rr ? Rr : Lr);
    L = Math.max(1, Math.min(N, L)); R = Math.max(1, Math.min(N, R));
    if ((L + R) % 3 === 0) { const s = R - L; L += Math.floor(s / 4); R -= Math.floor(s / 4); }

    const pal = isPalin(L, R);
    if (pal) {
        palCount++;
        const c = S_arr[L - 1];
        updateChar(L, String.fromCharCode((c.charCodeAt(0) - 97 + 1) % 26 + 97));
    } else {
        const c = S_arr[R - 1];
        updateChar(R, String.fromCharCode((c.charCodeAt(0) - 97 + 25) % 26 + 97));
    }
    lastAns = pal ? 1n : 0n;
    if (pal) checksum = (checksum + pow31[i + 1]) % MODn;

    if ((i + 1) % 1000 === 0) {
        const pr = BigInt(nextPrime(palCount));
        K = K * pr % KMODn;
        palCount = 0;
    }
}
console.log(checksum.toString());