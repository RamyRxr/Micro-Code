const fs = require("fs");
const path = require("path");

// ─── Parse input ───────────────────────────────────────────────────────────
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
        bids.push({ price, items, exclusions, dependencies, cats: Array.from(catSet) });
    }

    const pen = [];
    for (let r = 0; r < C; r++) pen.push(lines[idx++].trim().split(/\s+/).map(Number));

    // Prefer queries from the same input file after penalty matrix.
    // Fallback to queries.txt if the combined format is not present.
    let queries = [];
    if (idx < lines.length) {
        const q = Number(lines[idx++]);
        if (Number.isFinite(q) && q >= 0) {
            for (let i = 0; i < q && idx < lines.length; i++) {
                const line = lines[idx++].trim();
                if (line.length > 0) queries.push(line.split(/\s+/));
            }
        }
    }

    if (queries.length === 0) {
        const qpath = path.join(__dirname, "queries.txt");
        if (fs.existsSync(qpath)) {
            const qlines = fs.readFileSync(qpath, "utf8").replace(/\r/g, "").trim().split("\n");
            queries = qlines.filter(Boolean).map((l) => l.trim().split(/\s+/));
        }
    }

    return { N, B, C, bids, pen, queries };
}

// ─── Solver ────────────────────────────────────────────────────────────────
function buildSolver(N, B, C, bids, pen) {
    // Transitive deps
    const directDeps = bids.map(b => b.dependencies);
    const transDeps = Array.from({ length: B }, () => []);
    for (let i = 0; i < B; i++) {
        const seen = new Uint8Array(B);
        const stack = directDeps[i].slice();
        while (stack.length) {
            const d = stack.pop();
            if (seen[d]) continue;
            seen[d] = 1;
            transDeps[i].push(d);
            for (const dd of directDeps[d]) stack.push(dd);
        }
    }

    // Topological order for dependency-safe DFS traversal.
    const indeg = new Int32Array(B);
    const depGraph = Array.from({ length: B }, () => []);
    for (let i = 0; i < B; i++) {
        for (const d of directDeps[i]) {
            depGraph[d].push(i);
            indeg[i]++;
        }
    }
    const queue = [];
    for (let i = 0; i < B; i++) if (indeg[i] === 0) queue.push(i);
    const topo = [];
    for (let h = 0; h < queue.length; h++) {
        const u = queue[h];
        topo.push(u);
        for (const v of depGraph[u]) {
            indeg[v]--;
            if (indeg[v] === 0) queue.push(v);
        }
    }
    if (topo.length !== B) {
        // Fallback if input is malformed; spec guarantees DAG.
        const seen = new Uint8Array(B);
        for (const x of topo) seen[x] = 1;
        for (let i = 0; i < B; i++) if (!seen[i]) topo.push(i);
    }

    // Pairwise penalty: count each unordered category pair once.
    const pairPenalty = Array.from({ length: B }, () => new Int32Array(B));
    for (let i = 0; i < B; i++) {
        for (let j = i + 1; j < B; j++) {
            let sum = 0;
            const seenPair = new Uint8Array(C * C);
            for (const a of bids[i].cats) {
                for (const b of bids[j].cats) {
                    const lo = a < b ? a : b;
                    const hi = a < b ? b : a;
                    const key = lo * C + hi;
                    if (!seenPair[key]) {
                        seenPair[key] = 1;
                        sum += pen[lo][hi];
                    }
                }
            }
            pairPenalty[i][j] = sum;
            pairPenalty[j][i] = sum;
        }
    }

    // State: banned[], forced[], prices[]
    const banned = new Uint8Array(B);    // permanently removed
    const forced = new Uint8Array(B);    // must be in solution
    const prices = bids.map(b => b.price);

    // Items blocked by forced bids
    const forcedItems = new Set();
    // Forced set (for quick lookup)
    const forcedSet = new Set();

    function removeForcedBid(id) {
        if (!forced[id]) return;
        forced[id] = 0;
        forcedSet.delete(id);
        for (const it of bids[id].items) {
            let stillUsed = false;
            for (const f of forcedSet) {
                if (bids[f].items.includes(it)) {
                    stillUsed = true;
                    break;
                }
            }
            if (!stillUsed) forcedItems.delete(it);
        }
    }

    function computeSuffixPrice(activeBids) {
        const sp = new Int32Array(B + 1);
        for (let p = B - 1; p >= 0; p--) {
            const id = topo[p];
            sp[p] = sp[p + 1] + (activeBids[id] ? prices[id] : 0);
        }
        return sp;
    }

    function solve(topK = 1) {
        // Active bids: not banned, not conflicting with forced items (unless forced themselves)
        const active = new Uint8Array(B);
        for (let i = 0; i < B; i++) {
            if (banned[i]) continue;
            // If forced, always active
            if (forced[i]) { active[i] = 1; continue; }
            // If any item conflicts with forced items, skip
            if (bids[i].items.some(it => forcedItems.has(it))) continue;
            active[i] = 1;
        }

        // Precompute forced penalty (among forced bids)
        let forcedScore = 0;
        const forcedList = [...forcedSet];
        for (const f of forcedList) forcedScore += prices[f];
        for (let i = 0; i < forcedList.length; i++)
            for (let j = i + 1; j < forcedList.length; j++)
                forcedScore -= pairPenalty[forcedList[i]][forcedList[j]];

        const suffixPrice = computeSuffixPrice(active);

        const chosen = new Uint8Array(B);
        const excludedCount = new Uint16Array(B);
        const usedItems = new Uint8Array(N);
        const chosenList = [];

        // Pre-place forced bids
        for (const f of forcedList) {
            if (banned[f]) return [];
            // A forced bid cannot exclude any already chosen forced bid.
            for (const ex of bids[f].exclusions) {
                if (chosen[ex]) return [];
            }

            chosen[f] = 1;
            for (const it of bids[f].items) usedItems[it] = 1;
            for (const ex of bids[f].exclusions) excludedCount[ex]++;
            chosenList.push(f);
        }

        // For topK, collect distinct scores
        const distinctScores = new Set();
        let best = forcedScore;

        function canInclude(i) {
            if (!active[i] || forced[i]) return false; // forced already placed
            if (excludedCount[i] > 0) return false;
            if (bids[i].items.some(it => usedItems[it])) return false;
            for (const d of transDeps[i]) if (!chosen[d]) return false;
            // Also enforce the direction: if i excludes a chosen bid, i cannot be selected.
            for (const ex of bids[i].exclusions) if (chosen[ex]) return false;
            return true;
        }

        function dfs(pos, score) {
            if (score > best) best = score;

            if (pos >= B) {
                if (topK > 1) distinctScores.add(score);
                return;
            }
            if (score + suffixPrice[pos] <= best && topK === 1) return;

            const i = topo[pos];

            // Forced bids are mandatory; inactive bids are always skipped.
            if (forced[i] || !active[i]) {
                dfs(pos + 1, score);
                return;
            }

            // Exclude
            dfs(pos + 1, score);

            // Include (skip forced, they're already in)
            if (!canInclude(i)) return;

            let addPen = 0;
            for (const w of chosenList) addPen += pairPenalty[i][w];

            for (const it of bids[i].items) usedItems[it] = 1;
            for (const ex of bids[i].exclusions) excludedCount[ex]++;
            chosen[i] = 1;
            chosenList.push(i);

            dfs(pos + 1, score + prices[i] - addPen);

            chosenList.pop();
            chosen[i] = 0;
            for (const ex of bids[i].exclusions) excludedCount[ex]--;
            for (const it of bids[i].items) usedItems[it] = 0;
        }

        dfs(0, forcedScore);

        if (topK === 1) return best;

        // Return k-th distinct score
        const sorted = [...distinctScores].sort((a, b) => b - a);
        return sorted[Math.min(topK, sorted.length) - 1] ?? 0;
    }

    function forceAdd(bidId) {
        // Get full closure
        const closure = new Set([bidId, ...transDeps[bidId]]);

        // Contradiction check against banned bids first.
        for (const c of closure) {
            if (banned[c]) return false;
        }

        // Validate the full forced set after adding closure.
        const tempForced = new Uint8Array(B);
        for (const f of forcedSet) tempForced[f] = 1;
        for (const c of closure) tempForced[c] = 1;

        const used = new Uint8Array(N);
        for (let i = 0; i < B; i++) {
            if (!tempForced[i]) continue;
            for (const it of bids[i].items) {
                if (used[it]) return false;
                used[it] = 1;
            }
            for (const ex of bids[i].exclusions) {
                if (tempForced[ex]) return false;
            }
        }

        // Apply
        for (const c of closure) {
            forced[c] = 1;
            forcedSet.add(c);
            for (const it of bids[c].items) forcedItems.add(it);
            // Ban conflicting bids
            for (let i = 0; i < B; i++) {
                if (forced[i] || banned[i]) continue;
                if (bids[i].items.some(it => forcedItems.has(it))) banned[i] = 1;
            }
            // Type A disqualifies bids in the requested bid's exclusivity list.
        }
        for (const ex of bids[bidId].exclusions) {
            if (!forced[ex]) banned[ex] = 1;
        }
        return true;
    }

    function ban(bidId) {
        banned[bidId] = 1;
        removeForcedBid(bidId);
        // If a forced bid depends on this, it becomes illegal — also ban it
        for (let i = 0; i < B; i++) {
            if (!forced[i] || banned[i]) continue;
            if (transDeps[i].includes(bidId)) {
                banned[i] = 1;
                removeForcedBid(i);
            }
        }
    }

    function changePrice(bidId, newPrice) {
        prices[bidId] = newPrice;
    }

    return { solve, forceAdd, ban, changePrice };
}

// ─── Main ──────────────────────────────────────────────────────────────────
const filepath = process.argv[2] || path.join(__dirname, "input.txt");
const { N, B, C, bids, pen, queries } = parseInput(filepath);
const solver = buildSolver(N, B, C, bids, pen);

let total = 0;

for (const parts of queries) {
    const type = parts[0];

    if (type === "B") {
        solver.ban(parseInt(parts[1]));
        total += solver.solve(1);

    } else if (type === "C") {
        solver.changePrice(parseInt(parts[1]), parseInt(parts[2]));
        total += solver.solve(1);

    } else if (type === "K") {
        const k = parseInt(parts[1]);
        total += solver.solve(k);

    } else if (type === "A") {
        const bidId = parseInt(parts[1]);
        const ok = solver.forceAdd(bidId);
        if (!ok) {
            total += 0;
        } else {
            const after = solver.solve(1);
            total += after;
        }
    }
}

console.log(total);
