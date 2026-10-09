const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [R, C, Traw, I] = lines[0].split(' ').map(Number);
const T = BigInt(Traw);
const grid = lines.slice(1, R + 1);

const dr = { '>': 0, '<': 0, 'v': 1, '^': -1 };
const dc = { '>': 1, '<': -1, 'v': 0, '^': 0 };
const DEAD = -1;
const N = R * C;

const step = new Int32Array(N);
for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
        const belt = grid[r][c];
        const nr = r + dr[belt], nc = c + dc[belt];
        step[r * C + c] = (nr < 0 || nr >= R || nc < 0 || nc >= C) ? DEAD : nr * C + nc;
    }

const LOG = 61;
const anc = [new Int32Array(step)];
for (let k = 1; k < LOG; k++) {
    anc[k] = new Int32Array(N);
    for (let i = 0; i < N; i++) {
        const prev = anc[k - 1][i];
        anc[k][i] = prev === DEAD ? DEAD : anc[k - 1][prev];
    }
}

function fastForward(id, t) {
    let cur = id;
    for (let k = 0; k < LOG; k++) {
        if ((t >> BigInt(k)) & 1n) {
            cur = anc[k][cur];
            if (cur === DEAD) return DEAD;
        }
    }
    return cur;
}

let checksum = 0n;
for (let i = 0; i < I; i++) {
    const parts = lines[R + 1 + i].split(' ');
    const r = parseInt(parts[0]), c = parseInt(parts[1]);
    const finalId = fastForward(r * C + c, T);
    if (finalId !== DEAD) checksum += BigInt(finalId);
}

console.log(checksum.toString());