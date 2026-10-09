const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const MOD = 1_000_000_007n;
const N = parseInt(lines[0]);

// Build children list
const children = Array.from({ length: N }, () => []);
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 2) continue;
    const [p, c] = parts.map(Number);
    children[p].push(c);
}

// For each node i, do a DFS from i to find all descendants
// Then add (j - i)^2 for each descendant j
let result = 0n;

for (let i = 0; i < N; i++) {
    // DFS from i, skipping i itself
    const stack = [...children[i]];
    while (stack.length) {
        const j = stack.pop();
        const diff = BigInt(j - i);
        result = (result + diff * diff) % MOD;
        stack.push(...children[j]);
    }
}

console.log(result.toString());