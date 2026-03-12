const fs = require("fs");
const path = require("path");

const raw = fs.readFileSync(path.join(__dirname, "input.txt"), "utf8").replace(/\r/g, "").trim();

const lines = raw.split("\n");

const dishes = lines[0].split(",").map(Number);
const K = parseInt(lines[1]);
const n = dishes.length;

if (isNaN(K)) {
    console.error("Error: K is not defined. Make sure line 2 of input.txt contains the cooldown value.");
    process.exit(1);
}

function canPair(a, b, K, R) {
    for (let start = 1; start <= K + 1 && start <= R; start++) {
        const iSlots = new Set();
        let ok = true;
        for (let x = 0; x < a; x++) {
            const s = start + x * (K + 1);
            if (s > R) { ok = false; break; }
            iSlots.add(s);
        }
        if (!ok) continue;

        let count = 0, lastJ = -Infinity;
        for (let r = 1; r <= R; r++) {
            if (!iSlots.has(r) && r >= lastJ + K + 1) {
                count++;
                lastJ = r;
                if (count === b) break;
            }
        }
        if (count >= b) return true;
    }
    return false;
}

function pairLB(a, b, K) {
    let lo = 1, hi = (a + b) * (K + 1) + 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (canPair(a, b, K, mid) && canPair(b, a, K, mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

let ans = 0;
for (const d of dishes) ans = Math.max(ans, (d - 1) * (K + 1) + 1);
for (let i = 0; i < n; i++) {
    const a = dishes[i], b = dishes[(i + 1) % n];
    ans = Math.max(ans, pairLB(a, b, K));
}

console.log(ans);