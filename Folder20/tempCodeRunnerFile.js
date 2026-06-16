const fs = require("fs");
const path = require("path");

function solve(filepath) {
    const lines = fs.readFileSync(filepath, "utf8").replace(/\r/g, "").trim().split("\n");
    let lineIdx = 0;

    // --- Part 1 Parser ---
    const [N, B, C] = lines[lineIdx++].trim().split(/\s+/).map(Number);
    const itemCats = lines[lineIdx++].trim().split(/\s+/).map(Number);

    const bids = [];
    for (let i = 0; i < B; i++) {
        const line = lines[lineIdx++];
        const pipeIdx = line.indexOf("|");
        const gtIdx = line.indexOf(">");
        const left = line.slice(0, pipeIdx).trim().split(/\s+/).map(Number);
        const mid = line.slice(pipeIdx + 1, gtIdx).trim();
        const right = line.slice(gtIdx + 1).trim();

        const catSet = new Set();
        const items = left.slice(1);
        for (const it of items) catSet.add(itemCats[it]);

        bids.push({
            id: i,
            price: left[0],
            items: items,
            exclusions: mid ? mid.split(/\s+/).map(Number) : [],
            dependencies: right ? right.split(/\s+/).map(Number) : [],
            cats: Array.from(catSet)
        });
    }

    const pen = [];
    for (let r = 0; r < C; r++) {
        pen.push(lines[lineIdx++].trim().split(/\s+/).map(Number));
    }

    // --- Precomputations ---
    const transDeps = Array.from({ length: B }, () => new Set());
    for (let i = 0; i < B; i++) {
        const stack = [...bids[i].dependencies];
        while (stack.length) {
            const d = stack.pop();
            if (!transDeps[i].has(d)) {
                transDeps[i].add(d);
                stack.push(...bids[d].dependencies);
            }
        }
    }

    const pairPenalty = Array.from({ length: B }, () => new Int32Array(B));
    for (let i = 0; i < B; i++) {
        for (let j = i + 1; j < B; j++) {
            let sum = 0;
            const seenPair = new Set();
            for (const a of bids[i].cats) {
                for (const b of bids[j].cats) {
                    const lo = Math.min(a, b), hi = Math.max(a, b);
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

    // --- Dynamic State ---
    let forced = new Uint8Array(B);
    let banned = new Uint8Array(B);
    let currentOptimal = 0; // Tracks the absolute optimal of the previous state
    let totalResultSum = 0;

    function runOptimization(kLimit = 1) {
        let distinctScores = new Set();
        let sortedScores = [];

        const chosen = new Uint8Array(B);
        const excludedCount = new Uint16Array(B);
        const usedItems = new Uint8Array(N);
        const chosenList = [];

        // Pre-apply forced bids
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

        function dfs(idx, score) {
            if (idx === B) {
                if (!distinctScores.has(score)) {
                    distinctScores.add(score);
                    sortedScores.push(score);
                    sortedScores.sort((a, b) => b - a);
                    if (sortedScores.length > kLimit) sortedScores.pop();
                }
                return;
            }

            // Pruning
            if (sortedScores.length >= kLimit && score + getSuffix(idx) <= sortedScores[kLimit - 1]) return;

            // Skip branch (only if not forced)
            if (!forced[idx]) dfs(idx + 1, score);

            // Include branch
            if (!banned[idx] && !chosen[idx]) {
                if (excludedCount[idx] === 0 && bids[idx].items.every(it => !usedItems[it])) {
                    // Check if all dependencies are satisfied (or will be)
                    // Simplified: In this DAG, dependencies always have lower IDs or processed differently
                    // For logic consistency: include if valid
                    let p = 0;
                    for (const w of chosenList) p += pairPenalty[idx][w];
                    
                    const b = bids[idx];
                    for (const it of b.items) usedItems[it] = 1;
                    for (const ex of b.exclusions) excludedCount[ex]++;
                    chosen[idx] = 1;
                    chosenList.push(idx);

                    dfs(idx + 1, score + b.price - p);

                    chosenList.pop();
                    chosen[idx] = 0;
                    for (const ex of b.exclusions) excludedCount[ex]--;
                    for (const it of b.items) usedItems[it] = 0;
                }
            } else if (chosen[idx]) {
                dfs(idx + 1, score);
            }
        }

        function getSuffix(i) {
            let s = 0;
            for (let j = i; j < B; j++) if (!banned[j] && !forced[j]) s += bids[j].price;
            return s;
        }

        dfs(0, basePrice - basePenalty);
        return sortedScores;
    }

    // Solve Part 1 Initial
    currentOptimal = runOptimization(1)[0] || 0;

    // --- Process Queries ---
    const Q = parseInt(lines[lineIdx++]);
    for (let q = 0; q < Q; q++) {
        const parts = lines[lineIdx++].trim().split(/\s+/);
        const type = parts[0];

        if (type === 'A') {
            const bidId = parseInt(parts[1]);
            let tempForced = new Uint8Array(forced);
            let tempBanned = new Uint8Array(banned);
            let possible = true;

            const toForce = [bidId, ...transDeps[bidId]];
            for (const fId of toForce) {
                if (tempBanned[fId]) possible = false;
                tempForced[fId] = 1;
            }

            // Conflict check
            if (possible) {
                let items = new Set();
                for (let i = 0; i < B; i++) {
                    if (tempForced[i]) {
                        for (const it of bids[i].items) {
                            if (items.has(it)) { possible = false; break; }
                            items.add(it);
                        }
                        for (const exId of bids[i].exclusions) {
                            if (tempForced[exId]) { possible = false; break; }
                        }
                    }
                    if (!possible) break;
                }
            }

            if (possible) {
                forced = tempForced;
                let nextOpt = runOptimization(1)[0] || 0;
                totalResultSum += (nextOpt - currentOptimal);
                currentOptimal = nextOpt;
            } else {
                totalResultSum += 0;
            }

        } else if (type === 'B') {
            const bidId = parseInt(parts[1]);
            banned[bidId] = 1;
            // cascade bans to forced bids that depend on this
            for (let i = 0; i < B; i++) {
                if (forced[i] && transDeps[i].has(bidId)) {
                    forced[i] = 0;
                    banned[i] = 1;
                }
            }
            currentOptimal = runOptimization(1)[0] || 0;
            totalResultSum += currentOptimal;

        } else if (type === 'C') {
            const bidId = parseInt(parts[1]);
            const newPrice = parseInt(parts[2]);
            bids[bidId].price = newPrice;
            currentOptimal = runOptimization(1)[0] || 0;
            totalResultSum += currentOptimal;

        } else if (type === 'K') {
            const k = parseInt(parts[1]);
            const results = runOptimization(k);
            const val = results.length >= k ? results[k - 1] : (results.length > 0 ? results[results.length - 1] : 0);
            totalResultSum += val;
        }
    }

    return totalResultSum;
}

const filepath = path.join(__dirname, "input.txt");
console.log(solve(filepath));