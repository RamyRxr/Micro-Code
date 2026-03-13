const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const M = parseInt(lines[0]);
const MOD = 1000000009n;
const CELL = 256;

function modpow(b, e, m) { let r = 1n; b = b % m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; }
const inv6 = modpow(6n, MOD - 2n, MOD);

function sumSq(a, b) {
    if (a > b) return 0n;
    const A = BigInt(a), B = BigInt(b);
    const s1 = B * (B + 1n) % MOD * (2n * B + 1n) % MOD * inv6 % MOD;
    const Am1 = ((A - 1n) % MOD + MOD) % MOD;
    const s0 = Am1 * A % MOD * ((2n * A - 1n + MOD) % MOD) % MOD * inv6 % MOD;
    return (s1 - s0 + MOD) % MOD;
}
function cnt(a, b) { return a > b ? 0n : BigInt(b - a + 1) % MOD; }

function oneBoxEnergyFromTransformed(b) {
    const NX = cnt(b.x1, b.x2), NY = cnt(b.y1, b.y2), NZ = cnt(b.z1, b.z2);
    const SX = sumSq(b.x1, b.x2), SY = sumSq(b.y1, b.y2), SZ = sumSq(b.z1, b.z2);
    if (b.step === 1) {
        return (SX * NY % MOD * NZ % MOD + SY * NX % MOD * NZ % MOD + SZ * NX % MOD * NY % MOD) % MOD;
    }
    const hx1 = b.x1 / 2, hx2 = b.x2 / 2, hy1 = b.y1 / 2, hy2 = b.y2 / 2, hz1 = b.z1 / 2, hz2 = b.z2 / 2;
    const HNX = cnt(hx1, hx2), HNY = cnt(hy1, hy2), HNZ = cnt(hz1, hz2);
    const HSX = sumSq(hx1, hx2), HSY = sumSq(hy1, hy2), HSZ = sumSq(hz1, hz2);
    const half = (HSX * HNY % MOD * HNZ % MOD + HSY * HNX % MOD * HNZ % MOD + HSZ * HNX % MOD * HNY % MOD) % MOD;
    return 4n * half % MOD;
}

// 3D union energy using coordinate compress + sweep
// All boxes are step-1 (integer points)
function unionEnergy(boxes) {
    if (!boxes.length) return 0n;
    const xs = new Set();
    for (const b of boxes) { xs.add(b.x1); xs.add(b.x2 + 1); }
    const xv = [...xs].sort((a, b) => a - b);
    let E = 0n;
    for (let xi = 0; xi < xv.length - 1; xi++) {
        const xa = xv[xi], xb = xv[xi + 1] - 1;
        const rects = boxes.filter(b => b.x1 <= xa && b.x2 >= xb);
        if (!rects.length) continue;
        const SX = sumSq(xa, xb), NX = cnt(xa, xb);
        // 2D union of yz rects
        const ys = new Set();
        for (const r of rects) { ys.add(r.y1); ys.add(r.y2 + 1); }
        const yv = [...ys].sort((a, b) => a - b);
        let cyz = 0n, sy2 = 0n, sz2 = 0n;
        for (let yi = 0; yi < yv.length - 1; yi++) {
            const ya = yv[yi], yb = yv[yi + 1] - 1;
            const zints = rects.filter(r => r.y1 <= ya && r.y2 >= yb).map(r => [r.z1, r.z2]);
            if (!zints.length) continue;
            zints.sort((a, b) => a[0] - b[0]);
            const mg = [];
            for (const [a, b2] of zints) {
                if (mg.length && mg[mg.length - 1][1] >= a - 1) mg[mg.length - 1][1] = Math.max(mg[mg.length - 1][1], b2);
                else mg.push([a, b2]);
            }
            const NY = cnt(ya, yb), SY = sumSq(ya, yb);
            let NZ = 0n, SZ = 0n;
            for (const [za, zb] of mg) { NZ = (NZ + cnt(za, zb)) % MOD; SZ = (SZ + sumSq(za, zb)) % MOD; }
            cyz = (cyz + NY * NZ) % MOD;
            sy2 = (sy2 + SY * NZ) % MOD;
            sz2 = (sz2 + NY * SZ) % MOD;
        }
        E = (E + SX * cyz % MOD + NX * sy2 % MOD + NX * sz2 % MOD) % MOD;
    }
    return E;
}

function getBox(op) {
    if (!op) return null;
    const { mode, x1, x2, y1, y2, z1, z2 } = op;
    if (mode === 0) return { x1: -y2, x2: -y1, y1: x1, y2: x2, z1, z2, step: 1 };
    if (mode === 1) return { x1: 2 * x1, x2: 2 * x2, y1: 2 * y1, y2: 2 * y2, z1: 2 * z1, z2: 2 * z2, step: 2 };
    return { x1: z1, x2: z2, y1, y2, z1: x1, z2: x2, step: 1 };
}

function uniqueEnergyFromBoxes(all) {
    const s1 = all.filter(b => b.step === 1);
    const s2 = all.filter(b => b.step === 2);
    const s2h = s2.map(b => ({ x1: b.x1 / 2, x2: b.x2 / 2, y1: b.y1 / 2, y2: b.y2 / 2, z1: b.z1 / 2, z2: b.z2 / 2 }));
    const s1h = s1.map(b => ({
        x1: Math.ceil(b.x1 / 2), x2: Math.floor(b.x2 / 2),
        y1: Math.ceil(b.y1 / 2), y2: Math.floor(b.y2 / 2),
        z1: Math.ceil(b.z1 / 2), z2: Math.floor(b.z2 / 2)
    })).filter(b => b.x1 <= b.x2 && b.y1 <= b.y2 && b.z1 <= b.z2);
    const e1 = unionEnergy(s1);
    const e2 = 4n * unionEnergy(s2h) % MOD;
    const ov = [];
    for (const a of s1h) for (const b of s2h) {
        const ix1 = Math.max(a.x1, b.x1), ix2 = Math.min(a.x2, b.x2);
        const iy1 = Math.max(a.y1, b.y1), iy2 = Math.min(a.y2, b.y2);
        const iz1 = Math.max(a.z1, b.z1), iz2 = Math.min(a.z2, b.z2);
        if (ix1 <= ix2 && iy1 <= iy2 && iz1 <= iz2) ov.push({ x1: ix1, x2: ix2, y1: iy1, y2: iy2, z1: iz1, z2: iz2 });
    }
    const eov = 4n * unionEnergy(ov) % MOD;
    return (e1 + e2 - eov + MOD) % MOD;
}

function overlap3D(a, b) {
    return a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1 && a.z1 <= b.z2 && a.z2 >= b.z1;
}

function findComponents(boxes) {
    const n = boxes.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    const size = Array(n).fill(1);
    const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const unite = (a, b) => {
        let ra = find(a), rb = find(b);
        if (ra === rb) return;
        if (size[ra] < size[rb]) { const t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
    };

    const buckets = new Map();
    for (let i = 0; i < n; i++) {
        const b = boxes[i];
        const ix0 = Math.floor(b.x1 / CELL), ix1 = Math.floor(b.x2 / CELL);
        const iy0 = Math.floor(b.y1 / CELL), iy1 = Math.floor(b.y2 / CELL);
        const iz0 = Math.floor(b.z1 / CELL), iz1 = Math.floor(b.z2 / CELL);
        const seen = new Set();

        for (let ix = ix0; ix <= ix1; ix++)for (let iy = iy0; iy <= iy1; iy++)for (let iz = iz0; iz <= iz1; iz++) {
            const key = ix + "|" + iy + "|" + iz;
            const arr = buckets.get(key);
            if (arr) {
                for (const j of arr) {
                    if (seen.has(j)) continue;
                    seen.add(j);
                    if (overlap3D(b, boxes[j])) unite(i, j);
                }
            }
        }
        for (let ix = ix0; ix <= ix1; ix++)for (let iy = iy0; iy <= iy1; iy++)for (let iz = iz0; iz <= iz1; iz++) {
            const key = ix + "|" + iy + "|" + iz;
            let arr = buckets.get(key);
            if (!arr) { arr = []; buckets.set(key, arr); }
            arr.push(i);
        }
    }

    const groups = new Map();
    for (let i = 0; i < n; i++) {
        const r = find(i);
        let g = groups.get(r);
        if (!g) { g = []; groups.set(r, g); }
        g.push(i);
    }
    return [...groups.values()];
}

function uniqueEnergy(ops) {
    const all = [];
    for (const o of ops) { if (o !== null) all.push(getBox(o)); }
    if (!all.length) return 0n;

    const components = findComponents(all);
    let total = 0n;
    for (const comp of components) {
        if (comp.length === 1) {
            total = (total + oneBoxEnergyFromTransformed(all[comp[0]])) % MOD;
            continue;
        }
        const sub = [];
        for (const idx of comp) sub.push(all[idx]);
        total = (total + uniqueEnergyFromBoxes(sub)) % MOD;
    }
    return total;
}

const ops = [];
for (let i = 1; i <= M; i++) {
    const p = lines[i].split(' ');
    const mode = parseInt(p[0]);
    const [xr, yr, zr] = p[1].split(',');
    const pa = s => s.split('..').map(Number);
    const [x1, x2] = pa(xr), [y1, y2] = pa(yr), [z1, z2] = pa(zr);
    ops.push({
        mode, x1: Math.min(x1, x2), x2: Math.max(x1, x2),
        y1: Math.min(y1, y2), y2: Math.max(y1, y2),
        z1: Math.min(z1, z2), z2: Math.max(z1, z2)
    });
}

const Q = parseInt(lines[M + 1]);
let totalSum = 0n;
for (let q = 0; q < Q; q++) {
    const tok = lines[M + 2 + q].trim().split(' ');
    if (tok[0] === 'D') {
        ops[parseInt(tok[1])] = null;
    } else {
        const idx = parseInt(tok[1]);
        const [xr, yr, zr] = tok[2].split(',');
        const pa = s => s.split('..').map(Number);
        const [x1, x2] = pa(xr), [y1, y2] = pa(yr), [z1, z2] = pa(zr);
        // TRICK: mode IS applied (bypass note is misdirection)
        const mode = ops[idx].mode;
        ops[idx] = {
            mode, x1: Math.min(x1, x2), x2: Math.max(x1, x2),
            y1: Math.min(y1, y2), y2: Math.max(y1, y2),
            z1: Math.min(z1, z2), z2: Math.max(z1, z2)
        };
    }
    totalSum = (totalSum + uniqueEnergy(ops)) % MOD;
}
console.log(totalSum.toString());