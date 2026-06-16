const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [N, R, K] = lines[0].split(' ').map(Number);
const rootIds = lines[1].trim().split(' ').map(Number);

// ─── PART 1 ───────────────────────────────────────────────────────────────────
let part1Size = 0;
{
    const rc = new Int32Array(N);
    const alive1 = new Uint8Array(N);
    const sizes1 = new Int32Array(N);
    const refs1 = Array.from({ length: N }, () => new Set());
    const rootSet1 = new Set(rootIds);

    function freeObj(id) {
        alive1[id] = 0;
        for (const dst of refs1[id]) {
            if (!alive1[dst]) continue;
            rc[dst]--;
            if (rc[dst] === 0) freeObj(dst);
        }
        refs1[id].clear();
    }

    for (let i = 0; i < R; i++) {
        const parts = lines[2 + i].split(' ');
        const op = parts[0];
        if (op === 'ALLOC') {
            const id = +parts[1], sz = +parts[2];
            sizes1[id] = sz; alive1[id] = 1;
            rc[id] = rootSet1.has(id) ? 1 : 0;
        } else if (op === 'REF') {
            const src = +parts[1], dst = +parts[2];
            if (!alive1[src] || !alive1[dst]) continue;
            if (refs1[src].has(dst)) continue;
            refs1[src].add(dst); rc[dst]++;
        } else if (op === 'DELREF') {
            const src = +parts[1], dst = +parts[2];
            if (!alive1[src] || !alive1[dst]) continue;
            if (!refs1[src].has(dst)) continue;
            refs1[src].delete(dst); rc[dst]--;
            if (rc[dst] === 0) freeObj(dst);
        } else if (op === 'ADDROOT') {
            const id = +parts[1];
            if (!alive1[id]) continue;
            rootSet1.add(id); rc[id]++;
        } else if (op === 'DELROOT') {
            const id = +parts[1];
            if (!alive1[id]) continue;
            rootSet1.delete(id); rc[id]--;
            if (rc[id] === 0) freeObj(id);
        }
    }
    for (let i = 0; i < N; i++) if (alive1[i]) part1Size += sizes1[i];
}

// ─── PART 2 ───────────────────────────────────────────────────────────────────
const alive2 = new Uint8Array(N);
const sizes2 = new Int32Array(N);
const refs2 = Array.from({ length: N }, () => new Set());
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
    // Collect all to-be-freed first, then free them
    const toFree = [];
    for (let i = 0; i < N; i++) {
        if (alive2[i] && !marked[i]) toFree.push(i);
    }
    for (const id of toFree) {
        alive2[id] = 0;
        rootSet2.delete(id);
        refs2[id].clear();
    }
    // Remove freed objects from other objects' outgoing ref sets
    for (let i = 0; i < N; i++) {
        if (!alive2[i]) continue;
        for (const id of toFree) refs2[i].delete(id);
    }
}

let gcCounter = 0;

function tick() {
    gcCounter++;
    if (gcCounter % K === 0) markAndSweep();
}

for (let i = 0; i < R; i++) {
    const parts = lines[2 + i].split(' ');
    const op = parts[0];

    if (op === 'ALLOC') {
        const id = +parts[1], sz = +parts[2];
        sizes2[id] = sz;
        alive2[id] = 1;
        refs2[id] = new Set();

    } else if (op === 'REF') {
        const src = +parts[1], dst = +parts[2];
        if (!alive2[src] || !alive2[dst]) continue; // dead obj = true no-op, no tick
        refs2[src].add(dst);
        tick();

    } else if (op === 'DELREF') {
        const src = +parts[1], dst = +parts[2];
        if (!alive2[src] || !alive2[dst]) continue;
        refs2[src].delete(dst);
        tick();

    } else if (op === 'ADDROOT') {
        const id = +parts[1];
        if (!alive2[id]) continue;
        rootSet2.add(id);
        tick();

    } else if (op === 'DELROOT') {
        const id = +parts[1];
        if (!alive2[id]) continue;
        rootSet2.delete(id);
        tick();
    }
}

let part2Size = 0;
for (let i = 0; i < N; i++) if (alive2[i]) part2Size += sizes2[i];

const D = part2Size - part1Size;
console.log(part2Size * 1000000 + Math.abs(D));