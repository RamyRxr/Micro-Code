const fs = require("fs");
const path = require("path");

function solve(filepath) {
    const lines = fs.readFileSync(filepath, "utf8").replace(/\r/g, "").trim().split("\n");
    let idx = 0;

    // --- Parser ---
    const [N, B, C] = lines[idx++].trim().split(/\s+/).map(Number);
    const itemCats = lines[idx++].trim().split(/\s+/).map(Number);

    const bids = [];
    for (let i = 0; i < B; i++) {
        const line = lines[idx++];
        const pipeIdx = line.indexOf("|");
        const gtIdx = line.indexOf(">");
        const left = line.slice(0, pipeIdx).trim().split(/\s+/).map(Number);
        const mid = line.slice(pipeIdx + 1, gtIdx).trim();
        const right = line.slice(gtIdx + 1).trim();

        const items = left.slice(1);
        const catSet = new Set();
        for (const it of items) catSet.add(itemCats[it]);

        bids.push({
            id: i,
            price: left[0],
            items: items,
            exclusions: mid ? mid.split(/\s+/).filter(Boolean).map(Number) : [],
            dependencies: right ? right.split(/\s+/).filter(Boolean).map(Number) : [],
            cats: Array.from(catSet),
        });
    }

    const pen = [];
    for (let r = 0; r < C; r++) {
        pen.push(lines[idx++].trim().split(/\s+/).map(Number));
    }

    // --- Precomputations ---
    const transDeps = Array.from({ length: B }, () => []);
    for (let i = 0; i < B; i++) {
        const seen = new Uint8Array(B);
        const stack = [...bids[i].dependencies];
        while (stack.length) {
            const d = stack.pop();
            if (seen[d]) continue;
            seen[d] = 1;
            transDeps[i].push(d);
            stack.push(...bids[d].dependencies);
        }
    }

    const pairPenalty = Array.from({ length: B }, () => new Int32Array(B));
    for (let i = 0; i < B; i++) {
        for (let j = i + 1; j < B; j++) {
            let sum = 0;
            const seenPair = new Set();
            for (const a of bids[i].cats) {
                for (const b of bids[j].cats) {
                    const lo = a < b ? a : b;
                    const hi = a < b ? b : a;
                    const key = lo * 100 + hi;
                    if (!seenPair.has(key)) {
                        seenPair.add(key);
                        sum += pen[lo][hi];
                    }
                }
            }
            pairPenalty[i][j] = pairPenalty[j][i] = sum;
        }
    }

    // --- State Variables ---
    let forced = new Uint8Array(B);
    let banned = new Uint8Array(B);
    let currentOptimal = 0;
    let totalResultSum = 0;

    function runOptimization(kLimit = 1) {
        let distinctScores = [];
        const chosen = new Uint8Array(B);
        const excludedCount = new Uint16Array(B);
        const usedItems = new Uint8Array(N);
        const chosenList = [];

        // Apply permanent forced state
        let basePrice = 0;
        let basePenalty = 0;
        for (let i = 0; i < B; i++) {
            if (forced[i]) {
                basePrice += bids[i].price;
                for (const it of bids[i].items) usedItems[it] = 1;
                for (const ex of bids[i].exclusions) excludedCount[ex]++;
                for (const prev of chosenList) basePenalty += pairPenalty[i][prev];
                chosen[i] = 1;
                chosenList.push(i);
            }
        }

        const suffixPrice = new Int32Array(B + 1);
        for (let i = B - 1; i >= 0; i--) {
            suffixPrice[i] = suffixPrice[i + 1] + (banned[i] || forced[i] ? 0 : bids[i].price);
        }

        function dfs(i, score) {
            if (i === B) {
                if (!distinctScores.includes(score)) {
                    distinctScores.push(score);
                    distinctScores.sort((a, b) => b - a);
                    if (distinctScores.length > kLimit) distinctScores.pop();
                }
                return;
            }

            if (distinctScores.length >= kLimit && score + suffixPrice[i] <= distinctScores[kLimit - 1]) return;

            // Skip
            if (!forced[i]) dfs(i + 1, score);

            // Include
            if (!banned[i] && !forced[i] && excludedCount[i] === 0) {
                let overlap = false;
                for (const it of bids[i].items) if (usedItems[it]) { overlap = true; break; }
                if (!overlap) {
                    for (const d of transDeps[i]) if (!chosen[d]) { overlap = true; break; }
                }

                if (!overlap) {
                    let p = 0;
                    for (const w of chosenList) p += pairPenalty[i][w];
                    const b = bids[i];
                    for (const it of b.items) usedItems[it] = 1;
                    for (const ex of b.exclusions) excludedCount[ex]++;
                    chosen[i] = 1;
                    chosenList.push(i);

                    dfs(i + 1, score + b.price - p);

                    chosenList.pop();
                    chosen[i] = 0;
                    for (const ex of b.exclusions) excludedCount[ex]--;
                    for (const it of b.items) usedItems[it] = 0;
                }
            } else if (forced[i]) {
                dfs(i + 1, score);
            }
        }

        dfs(0, basePrice - basePenalty);
        return distinctScores;
    }

    // Part 1 Initial
    currentOptimal = runOptimization(1)[0] || 0;

    const Q = parseInt(lines[idx++]);
    for (let q = 0; q < Q; q++) {
        const parts = lines[idx++].trim().split(/\s+/);
        const type = parts[0];

        if (type === 'A') {
            const id = parseInt(parts[1]);
            let tempForced = new Uint8Array(forced);
            let valid = !banned[id];
            if (valid) {
                tempForced[id] = 1;
                for (const d of transDeps[id]) {
                    if (banned[d]) { valid = false; break; }
                    tempForced[d] = 1;
                }
            }
            // Logic: check conflicts within the new forced set
            if (valid) {
                let items = new Uint8Array(N);
                for (let i = 0; i < B; i++) {
                    if (tempForced[i]) {
                        for (const it of bids[i].items) {
                            if (items[it]) { valid = false; break; }
                            items[it] = 1;
                        }
                        for (const ex of bids[i].exclusions) if (tempForced[ex]) valid = false;
                    }
                    if (!valid) break;
                }
            }

            if (valid) {
                forced = tempForced;
                let next = runOptimization(1)[0] || 0;
                totalResultSum += (next - currentOptimal);
                currentOptimal = next;
            }
        } else if (type === 'B') {
            const id = parseInt(parts[1]);
            banned[id] = 1;
            for (let i = 0; i < B; i++) if (forced[i] && transDeps[i].includes(id)) { forced[i] = 0; banned[i] = 1; }
            currentOptimal = runOptimization(1)[0] || 0;
            totalResultSum += currentOptimal;
        } else if (type === 'C') {
            bids[parseInt(parts[1])].price = parseInt(parts[2]);
            currentOptimal = runOptimization(1)[0] || 0;
            totalResultSum += currentOptimal;
        } else if (type === 'K') {
            const res = runOptimization(parseInt(parts[1]));
            totalResultSum += (res.length > 0 ? res[res.length - 1] : 0);
        }
    }

    return totalResultSum;
}

const filepath = path.join(__dirname, "test1.txt");
console.log(solve(filepath));