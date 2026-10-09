const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const lines = fs.readFileSync(path.join(__dirname, './input.txt'), 'utf8').replace(/\r/g, '').trim().split('\n');

const [N, R, K] = lines[0].split(' ').map(Number);
const rootIds = lines[1].trim().split(' ').map(Number);

// Part 1 is delegated to the accepted solution file to avoid divergence.
const part1Size = BigInt(execFileSync(process.execPath, [path.join(__dirname, 'part-1.js')], { encoding: 'utf8' }).trim());

// Part 2: periodic mark-and-sweep every K effective non-ALLOC operations.
const alive2 = new Uint8Array(N);
const sizes2 = new Int32Array(N);
const refs2 = Array.from({ length: N }, () => new Set());
const rev2 = Array.from({ length: N }, () => new Set());
const rootSet2 = new Set(rootIds);

function markAndSweep() {
    const marked = new Uint8Array(N);
    const stack = [];

    for (const id of rootSet2) {
        if (alive2[id] && !marked[id]) {
            marked[id] = 1;
            stack.push(id);
        }
    }

    while (stack.length > 0) {
        const cur = stack.pop();
        for (const dst of refs2[cur]) {
            if (alive2[dst] && !marked[dst]) {
                marked[dst] = 1;
                stack.push(dst);
            }
        }
    }

    for (let i = 0; i < N; i++) {
        if (!alive2[i] || marked[i]) continue;

        alive2[i] = 0;
        rootSet2.delete(i);

        for (const dst of refs2[i]) rev2[dst].delete(i);
        refs2[i].clear();

        for (const src of rev2[i]) refs2[src].delete(i);
        rev2[i].clear();
    }
}

let gcCounter = 0;

function tickAndMaybeGC() {
    gcCounter++;
    if (K > 0 && gcCounter % K === 0) markAndSweep();
}

for (let i = 0; i < R; i++) {
    const parts = lines[2 + i].split(' ');
    const op = parts[0];

    if (op === 'ALLOC') {
        const id = +parts[1], sz = +parts[2];
        sizes2[id] = sz;
        alive2[id] = 1;
        refs2[id] = new Set();
        rev2[id] = new Set();
        continue;
    }

    if (op === 'REF') {
        const src = +parts[1], dst = +parts[2];
        if (!alive2[src] || !alive2[dst]) continue;
        if (!refs2[src].has(dst)) {
            refs2[src].add(dst);
            rev2[dst].add(src);
        }
        tickAndMaybeGC();
    } else if (op === 'DELREF') {
        const src = +parts[1], dst = +parts[2];
        if (!alive2[src] || !alive2[dst]) continue;
        if (refs2[src].has(dst)) {
            refs2[src].delete(dst);
            rev2[dst].delete(src);
        }
        tickAndMaybeGC();
    } else if (op === 'ADDROOT') {
        const id = +parts[1];
        if (!alive2[id]) continue;
        rootSet2.add(id);
        tickAndMaybeGC();
    } else if (op === 'DELROOT') {
        const id = +parts[1];
        if (!alive2[id]) continue;
        rootSet2.delete(id);
        tickAndMaybeGC();
    }
}

let part2Size = 0n;
for (let i = 0; i < N; i++) if (alive2[i]) part2Size += BigInt(sizes2[i]);

const D = part2Size - part1Size;
const result = part2Size * 1000000n + (D < 0n ? -D : D);
console.log(result.toString());
