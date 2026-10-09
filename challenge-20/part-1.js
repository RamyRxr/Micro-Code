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

    return { N, B, C, bids, pen };
}

function solve(filepath) {
    const { N, B, C, bids, pen } = parseInput(filepath);

    // Transitive dependency closure for each bid.
    const directDeps = bids.map((b) => b.dependencies);
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

    // Pairwise penalty between bids using full cross-category Cartesian product.
    const pairPenalty = Array.from({ length: B }, () => new Int32Array(B));
    for (let i = 0; i < B; i++) {
        for (let j = i + 1; j < B; j++) {
            let sum = 0;

            for (const a of bids[i].cats) {
                for (const b of bids[j].cats) {
                    sum += pen[a][b];
                }
            }

            pairPenalty[i][j] = sum;
            pairPenalty[j][i] = sum;
        }
    }

    // Suffix bound on remaining possible price gain.
    const suffixPrice = new Int32Array(B + 1);
    for (let i = B - 1; i >= 0; i--) {
        suffixPrice[i] = suffixPrice[i + 1] + bids[i].price;
    }

    const chosen = new Uint8Array(B);
    const excludedCount = new Uint16Array(B);
    const usedItems = new Uint8Array(N);
    const chosenList = [];

    let best = 0;

    function canInclude(i) {
        if (excludedCount[i] > 0) return false;

        const bid = bids[i];

        for (const it of bid.items) {
            if (usedItems[it]) return false;
        }

        for (const d of transDeps[i]) {
            if (!chosen[d]) return false;
        }

        return true;
    }

    function dfs(i, score) {
        if (score > best) best = score;

        if (i >= B) return;

        if (score + suffixPrice[i] <= best) return;

        // Exclude branch
        dfs(i + 1, score);

        // Include branch
        if (!canInclude(i)) return;

        let addPenalty = 0;
        for (const w of chosenList) addPenalty += pairPenalty[i][w];

        const bid = bids[i];
        for (const it of bid.items) usedItems[it] = 1;
        for (const ex of bid.exclusions) excludedCount[ex]++;
        chosen[i] = 1;
        chosenList.push(i);

        dfs(i + 1, score + bid.price - addPenalty);

        chosenList.pop();
        chosen[i] = 0;
        for (const ex of bid.exclusions) excludedCount[ex]--;
        for (const it of bid.items) usedItems[it] = 0;
    }

    dfs(0, 0);
    return best;
}

const filepath = process.argv[2] || path.join(__dirname, "input.txt");
console.log(solve(filepath));
