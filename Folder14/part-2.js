const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [R, C, Traw, I] = lines[0].split(' ').map(Number);
const T = BigInt(Traw);
const grid = lines.slice(1, R + 1);

const MOD = 1000000009;
const MODn = 1000000009n;
const N = R * C;

const dr = { '>': 0, '<': 0, 'v': 1, '^': -1 };
const dc = { '>': 1, '<': -1, 'v': 0, '^': 0 };

const nxt = new Int32Array(N);
for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
        const belt = grid[r][c];
        nxt[r * C + c] = (((r + dr[belt]) + R) % R) * C + (((c + dc[belt]) + C) % C);
    }


const LOG = 60; 
const liftPos = [new Int32Array(nxt)];
const liftSum = [new Uint32Array(N)];
for (let i = 0; i < N; i++) liftSum[0][i] = nxt[i] % MOD;

for (let k = 1; k < LOG; k++) {
    liftPos[k] = new Int32Array(N);
    liftSum[k] = new Uint32Array(N);
    for (let i = 0; i < N; i++) {
        const mid = liftPos[k - 1][i];
        liftPos[k][i] = liftPos[k - 1][mid];
        liftSum[k][i] = (liftSum[k - 1][i] + liftSum[k - 1][mid]) % MOD;
    }
}

function sumSteps(start, t) {
    let cur = start, sum = 0n, rem = t;
    for (let k = LOG - 1; k >= 0; k--) {
        if (rem >= (1n << BigInt(k))) {
            sum = (sum + BigInt(liftSum[k][cur])) % MODn;
            cur = liftPos[k][cur];
            rem -= (1n << BigInt(k));
        }
    }
    return sum;
}

let total = 0n;
for (let i = 0; i < I; i++) {
    const parts = lines[R + 1 + i].split(' ');
    total = (total + sumSteps(parseInt(parts[0]) * C + parseInt(parts[1]), T)) % MODn;
}

console.log(total.toString());