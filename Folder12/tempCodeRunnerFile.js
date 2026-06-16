const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [N, R] = lines[0].split(' ').map(Number);
const rootIds = lines[1].trim().split(' ').map(Number);

const rc = new Int32Array(N);
const alive = new Uint8Array(N);
const sizes = new Int32Array(N);
const refs = Array.from({ length: N }, () => new Set());
const rootSet = new Set(rootIds);

function freeObj(id) {
    alive[id] = 0;
    for (const dst of refs[id]) {
        if (!alive[dst]) continue;
        rc[dst]--;
        if (rc[dst] === 0) freeObj(dst);
    }
    refs[id].clear();
}

for (let i = 0; i < R; i++) {
    const parts = lines[2 + i].split(' ');
    const op = parts[0];

    if (op === 'ALLOC') {
        const id = +parts[1], sz = +parts[2];
        sizes[id] = sz;
        alive[id] = 1;
        rc[id] = rootSet.has(id) ? 1 : 0;
    } else if (op === 'REF') {
        const src = +parts[1], dst = +parts[2];
        if (!alive[src] || !alive[dst]) continue;
        if (refs[src].has(dst)) continue; // duplicate REF is full no-op
        refs[src].add(dst);
        rc[dst]++;
    } else if (op === 'DELREF') {
        const src = +parts[1], dst = +parts[2];
        if (!alive[src] || !alive[dst]) continue;
        if (!refs[src].has(dst)) continue;
        refs[src].delete(dst);
        rc[dst]--;
        if (rc[dst] === 0) freeObj(dst);
    } else if (op === 'ADDROOT') {
        const id = +parts[1];
        if (!alive[id]) continue;
        rootSet.add(id);
        rc[id]++;
    } else if (op === 'DELROOT') {
        const id = +parts[1];
        if (!alive[id]) continue;
        rootSet.delete(id);
        rc[id]--;
        if (rc[id] === 0) freeObj(id);
    }
}

let total = 0;
for (let i = 0; i < N; i++) if (alive[i]) total += sizes[i];
console.log(total);