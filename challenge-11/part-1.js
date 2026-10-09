const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const N = lines.length;
const startCols = lines.map(line => line.indexOf("o"));

const MOD = 10000027n;

let bestC = N + 1;
let bestResult = -1n;

const cols = new Array(N).fill(0);
const usedCol = new Array(N).fill(false);
const diagMain = new Array(2 * N).fill(false); 
const diagAnti = new Array(2 * N).fill(false); 

function encode(perm, C) {
    if (C === 0) {
        return BigInt(perm[0]) % MOD;
    }
    const bigC = BigInt(C);
    let result = 0n;
    result = BigInt(perm[0]);

    let power = bigC * bigC;
    for (let i = 1; i < N; i++) {
        result = (result + BigInt(perm[i]) * power) % MOD;
        power = (power * bigC) % MOD;
    }
    return result;
}

function backtrack(row) {
    if (row === N) {
        let cost = 0;
        for (let r = 0; r < N; r++) {
            if (cols[r] !== startCols[r]) cost++;
        }

        if (cost < bestC) {
            bestC = cost;
            bestResult = encode(cols, cost);
        } else if (cost === bestC) {
            const enc = encode(cols, cost);
            if (enc > bestResult) bestResult = enc;
        }
        return;
    }

    for (let c = 0; c < N; c++) {
        if (usedCol[c]) continue;
        if (diagMain[row - c + N]) continue;
        if (diagAnti[row + c]) continue;

        cols[row] = c;
        usedCol[c] = true;
        diagMain[row - c + N] = true;
        diagAnti[row + c] = true;

        backtrack(row + 1);

        usedCol[c] = false;
        diagMain[row - c + N] = false;
        diagAnti[row + c] = false;
    }
}

backtrack(0);

console.log(Number(bestResult));
