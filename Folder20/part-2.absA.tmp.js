const fs = require("fs");
const path = require("path");

function parseInput(filepath) {
    const lines = fs.readFileSync(filepath, "utf8").replace(/\r/g, "").trim().split("\n");
    let idx = 0;

    const [N, B, C] = lines[idx++].trim().split(/\s+/).map(Number);
    const itemCats = lines[idx++].trim().split(/\s+/).map(Number);

    const bids = [];
    for (let i = 0; i < B; i++) {
        const line = lines[idx++];
        const pipeIdx = line.indexOf("|");
        const gtIdx = line.indexOf(">");

        const left = line.slice(0, pipeIdx).trim();
        const mid = line.slice(pipeIdx + 1, gtIdx).trim();
        const right = line.slice(gtIdx + 1).trim();

        const lt = left.split(/\s+/).filter(Boolean).map(Number);
        const price = lt[0];
        const items = lt.slice(1);

        const exclusions = mid ? mid.split(/\s+/).filter(Boolean).map(Number) : [];
        const dependencies = right ? right.split(/\s+/).filter(Boolean).map(Number) : [];

        const catSet = new Set();
        for (const it of items) catSet.add(itemCats[it]);

        bids.push({
            id: i,
            price,
            items,
            exclusions,
            dependencies,
            cats: Array.from(catSet),
        });
    }

    const pen = [];
    for (let r = 0; r < C; r++) {
        pen.push(lines[idx++].trim().split(/\s+/).map(Number));
    }

    const Q = Number(lines[idx++].trim());
    const queries = [];
    for (let q = 0; q < Q; q++) queries.push(lines[idx++].trim().split(/\s+/));

    return { N, B, C, bids, pen, Q, queries };
}

function buildTransitiveDeps(bids) {
    const B = bids.length;
    const trans = Array.from({ length: B }, () => []);
    for (let i = 0; i < B; i++) {
        const seen = new Uint8Array(B);
        const stack = bids[i].dependencies.slice();
        while (stack.length) {
            const d = stack.pop();
            if (seen[d]) continue;
            seen[d] = 1;
            trans[i].push(d);
            for (const dd of bids[d].dependencies) stack.push(dd);
        }
    }
    return trans;
}

function topoOrder(bids) {
    const B = bids.length;
    const indeg = new Int32Array(B);
    const g = Array.from({ length: B }, () => []);

    for (let i = 0; i < B; i++) {
        for (const d of bids[i].dependencies) {
            g[d].push(i);
            indeg[i]++;
        }
    }

    const q = [];
    for (let i = 0; i < B; i++) if (indeg[i] === 0) q.push(i);

    const order = [];
    for (let h = 0; h < q.length; h++) {
        const u = q[h];
        order.push(u);
        for (const v of g[u]) {
            indeg[v]--;
            if (indeg[v] === 0) q.push(v);
        }
    }

    // Fallback for malformed DAG input (spec says DAG, so this should not happen).
    if (order.length !== B) {
        const seen = new Uint8Array(B);
        for (const x of order) seen[x] = 1;
        for (let i = 0; i < B; i++) if (!seen[i]) order.push(i);
    }

    return order;
}

function buildPairPenalty(bids, pen, C) {
    const B = bids.length;
    const pairPenalty = Array.from({ length: B }, () => new Int32Array(B));
    for (let i = 0; i < B; i++) {
        for (let j = i + 1; j < B; j++) {
            let sum = 0;
            const seen = new Uint8Array(C * C);
            for (const a of bids[i].cats) {
                for (const b of bids[j].cats) {
                    const lo = a < b ? a : b;
                    const hi = a < b ? b : a;
                    const key = lo * C + hi;
                    if (!seen[key]) {
                        seen[key] = 1;
                        sum += pen[lo][hi];
                    }
                }
            }
            pairPenalty[i][j] = sum;
            pairPenalty[j][i] = sum;
        }
    }
    return pairPenalty;
}

function makeOptimizer(ctx) {
    const { N, B, bids, topo, transDeps, pairPenalty } = ctx;

    function runOptimization(forced, banned, kLimit) {
        const chosen = new Uint8Array(B);
        const excludedCount = new Uint16Array(B);
        const usedItems = new Uint8Array(N);
        const chosenList = [];

        // Validate and pre-apply forced bids.
        let baseScore = 0;
        for (const id of topo) {
            if (!forced[id]) continue;
            if (banned[id]) return [];

            for (const d of transDeps[id]) {
                if (!forced[d]) return [];
                if (banned[d]) return [];
            }

            if (excludedCount[id] > 0) return [];

            for (const it of bids[id].items) {
                if (usedItems[it]) return [];
            }

            for (const ex of bids[id].exclusions) {
                if (chosen[ex]) return [];
            }

            let addPenalty = 0;
            for (const w of chosenList) addPenalty += pairPenalty[id][w];

            for (const it of bids[id].items) usedItems[it] = 1;
            for (const ex of bids[id].exclusions) excludedCount[ex]++;
            chosen[id] = 1;
            chosenList.push(id);

            baseScore += bids[id].price - addPenalty;
        }

        const suffixPrice = new Int32Array(topo.length + 1);
        for (let p = topo.length - 1; p >= 0; p--) {
            const id = topo[p];
            suffixPrice[p] = suffixPrice[p + 1] + (banned[id] || forced[id] ? 0 : bids[id].price);
        }

        const bestDistinct = [];
        const seen = new Set();

        function pushScore(score) {
            if (seen.has(score)) return;
            seen.add(score);
            bestDistinct.push(score);
            bestDistinct.sort((a, b) => b - a);
            if (bestDistinct.length > kLimit) bestDistinct.pop();
        }

        function canInclude(id) {
            if (banned[id] || forced[id]) return false;
            if (excludedCount[id] > 0) return false;

            for (const it of bids[id].items) {
                if (usedItems[it]) return false;
            }

            for (const d of transDeps[id]) {
                if (!chosen[d]) return false;
            }

            for (const ex of bids[id].exclusions) {
                if (chosen[ex]) return false;
            }

            return true;
        }

        function dfs(pos, score) {
            if (bestDistinct.length >= kLimit && score + suffixPrice[pos] <= bestDistinct[kLimit - 1]) {
                return;
            }

            if (pos === topo.length) {
                pushScore(score);
                return;
            }

            const id = topo[pos];

            if (forced[id] || banned[id]) {
                dfs(pos + 1, score);
                return;
            }

            // Exclude branch
            dfs(pos + 1, score);

            // Include branch
            if (!canInclude(id)) return;

            let addPenalty = 0;
            for (const w of chosenList) addPenalty += pairPenalty[id][w];

            for (const it of bids[id].items) usedItems[it] = 1;
            for (const ex of bids[id].exclusions) excludedCount[ex]++;
            chosen[id] = 1;
            chosenList.push(id);

            dfs(pos + 1, score + bids[id].price - addPenalty);

            chosenList.pop();
            chosen[id] = 0;
            for (const ex of bids[id].exclusions) excludedCount[ex]--;
            for (const it of bids[id].items) usedItems[it] = 0;
        }

        dfs(0, baseScore);
        return bestDistinct;
    }

    return { runOptimization };
}

function solve(filepath) {
    const data = parseInput(filepath);
    const { B, bids, C, pen, queries } = data;

    const transDeps = buildTransitiveDeps(bids);
    const topo = topoOrder(bids);
    const pairPenalty = buildPairPenalty(bids, pen, C);

    const optimizer = makeOptimizer({
        N: data.N,
        B,
        bids,
        topo,
        transDeps,
        pairPenalty,
    });

    const forced = new Uint8Array(B);
    const banned = new Uint8Array(B);

    let total = 0;
    let currentOptimal = 0;

    {
        const first = optimizer.runOptimization(forced, banned, 1);
        currentOptimal = first.length ? first[0] : 0;
    }

    function collectForceClosure(id) {
        const set = new Set([id]);
        for (const d of transDeps[id]) set.add(d);
        return Array.from(set);
    }

    function applyBanCascade(startId) {
        const q = [startId];
        const inQueue = new Uint8Array(B);
        inQueue[startId] = 1;

        while (q.length) {
            const b = q.pop();
            if (banned[b]) {
                // continue; still need to process dependents once, so don't skip here based on previous visits
            }

            banned[b] = 1;
            forced[b] = 0;

            for (let i = 0; i < B; i++) {
                if (!forced[i]) continue;
                // If forced bid i depends on banned bid b (transitively), i becomes illegal and is removed too.
                if (transDeps[i].includes(b)) {
                    if (!inQueue[i]) {
                        inQueue[i] = 1;
                        q.push(i);
                    }
                }
            }
        }
    }

    for (const q of queries) {
        const type = q[0];

        if (type === "A") {
            const id = Number(q[1]);
            const closure = collectForceClosure(id);

            let ok = true;

            // Any banned bid in closure means contradiction.
            for (const f of closure) {
                if (banned[f]) {
                    ok = false;
                    break;
                }
            }

            // Check conflicts with already forced bids and inside closure.
            if (ok) {
                const tempForced = new Uint8Array(forced);
                for (const f of closure) tempForced[f] = 1;

                const forcedItems = new Uint8Array(data.N);
                for (let i = 0; i < B && ok; i++) {
                    if (!tempForced[i]) continue;
                    for (const it of bids[i].items) {
                        if (forcedItems[it]) {
                            ok = false;
                            break;
                        }
                        forcedItems[it] = 1;
                    }
                    if (!ok) break;

                    for (const ex of bids[i].exclusions) {
                        if (tempForced[ex]) {
                            ok = false;
                            break;
                        }
                    }
                }
            }

            if (!ok) {
                total += 0;
                continue;
            }

            // Apply force permanently.
            for (const f of closure) forced[f] = 1;

            // Immediately and permanently disqualify bids that share items with closure
            // and bids listed in forced bids' exclusivity lists.
            const touchedItems = new Uint8Array(data.N);
            for (const f of closure) {
                for (const it of bids[f].items) touchedItems[it] = 1;
            }

            for (let i = 0; i < B; i++) {
                if (forced[i]) continue;
                for (const it of bids[i].items) {
                    if (touchedItems[it]) {
                        banned[i] = 1;
                        break;
                    }
                }
            }

            for (const f of closure) {
                for (const ex of bids[f].exclusions) {
                    if (!forced[ex]) banned[ex] = 1;
                }
            }

            const after = optimizer.runOptimization(forced, banned, 1);
            const nextOptimal = after.length ? after[0] : 0;

            // Type A contributes marginal change by convention.
            total += nextOptimal;
            currentOptimal = nextOptimal;
            continue;
        }

        if (type === "B") {
            const id = Number(q[1]);
            applyBanCascade(id);

            const res = optimizer.runOptimization(forced, banned, 1);
            currentOptimal = res.length ? res[0] : 0;
            total += currentOptimal;
            continue;
        }

        if (type === "C") {
            const id = Number(q[1]);
            const newPrice = Number(q[2]);
            bids[id].price = newPrice;

            const res = optimizer.runOptimization(forced, banned, 1);
            currentOptimal = res.length ? res[0] : 0;
            total += currentOptimal;
            continue;
        }

        if (type === "K") {
            const k = Number(q[1]);
            const res = optimizer.runOptimization(forced, banned, k);
            const val = res.length === 0 ? 0 : res[Math.min(k, res.length) - 1];
            total += val;
            continue;
        }
    }

    return total;
}

const filepath = process.argv[2] || path.join(__dirname, "input.txt");
console.log(solve(filepath));

