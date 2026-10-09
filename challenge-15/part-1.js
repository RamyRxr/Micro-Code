const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [N, Q, Kraw] = lines[0].split(' ').map(Number);
const K = BigInt(Kraw);
const S = lines[1];
const MOD = 1000000009n;

function buildManacher(s) {
    const t = '#' + s.split('').join('#') + '#';
    const m = t.length;
    const p = new Int32Array(m);
    let c = 0, r = 0;
    for (let i = 0; i < m; i++) {
        if (i < r) p[i] = Math.min(r - i, p[2 * c - i]);
        while (i - p[i] - 1 >= 0 && i + p[i] + 1 < m && t[i - p[i] - 1] === t[i + p[i] + 1]) p[i]++;
        if (i + p[i] > r) { c = i; r = i + p[i]; }
    }
    return p;
}

function isPalindrome(p, l, r) {
    const center = l + r + 1; 
    const radius = r - l + 1;
    return p[center] >= radius;
}

const manacher = buildManacher(S);

const pow31 = new BigInt64Array(Q + 1);
pow31[0] = 1n;
for (let i = 1; i <= Q; i++) pow31[i] = pow31[i - 1] * 31n % MOD;

let lastAns = 0n;
let checksum = 0n;

for (let i = 0; i < Q; i++) {
    const parts = lines[2 + i].split(' ');
    const A = BigInt(parts[0]);
    const B = BigInt(parts[1]);

    const key = lastAns * K;
    const Lraw = A ^ key;
    const Rraw = B ^ key;

    let L = Number(Lraw < Rraw ? Lraw : Rraw);
    let R = Number(Lraw < Rraw ? Rraw : Lraw);
    L = Math.max(1, Math.min(N, L));
    R = Math.max(1, Math.min(N, R));

    if ((L + R) % 3 === 0) {
        const span = R - L;
        const shrink = Math.floor(span / 4);
        L += shrink;
        R -= shrink;
    }

    const pal = isPalindrome(manacher, L - 1, R - 1);
    lastAns = pal ? 1n : 0n;
    if (pal) checksum = (checksum + pow31[i + 1]) % MOD;
}

console.log(checksum.toString());