const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const MOD = 1_000_000_007n;
const N = parseInt(lines[0]);

const parent = new Array(N).fill(-1);

for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 2) continue;
    const [p, c] = parts.map(Number);
    parent[c] = p;
}

// Get path from node to root
function pathToRoot(node) {
    const path = [];
    while (node !== -1) {
        path.push(node);
        node = parent[node];
    }
    return path;
}

// LCA = first common node in both paths to root
function lca(i, j) {
    const ancestorsI = new Set(pathToRoot(i));
    for (const node of pathToRoot(j)) {
        if (ancestorsI.has(node)) return node;
    }
}

// Depth = distance from root (path length - 1)
function depth(node) {
    return pathToRoot(node).length - 1;
}

let S = 0n;
for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
        S = (S + BigInt(depth(lca(i, j)))) % MOD;
    }
}

console.log(S.toString());