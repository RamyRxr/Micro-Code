const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8")
    .replace(/\r/g, "").trim().split("\n");

const N = lines.length;
const startCols = lines.map(line => line.indexOf("o"));

const MOD = 10000027n;

let minC = Infinity;
let bestResult = -1n;

function getEncodedValue(perm, C) {
    const bigC = BigInt(C);
    let res = BigInt(perm[0]); // col_0 * C^0
    if (N > 1) {
        let power = bigC * bigC; // C^2 (Skip C^1)
        for (let i = 1; i < N; i++) {
            res += BigInt(perm[i]) * power;
            // No modulo here! Keep it as a massive BigInt for comparison
            power *= bigC;
        }
    }
    return res;
}

const cols = new Array(N);
const usedCol = new Array(N).fill(false);
const diag1 = new Array(2 * N).fill(false);
const diag2 = new Array(2 * N).fill(false);

function backtrack(row) {
    if (row === N) {
        let currentC = 0;
        for (let i = 0; i < N; i++) {
            // Distance: |r1-r2| + |c1-c2|
            // Assuming Row i maps to Row i as per walkthrough
            currentC += Math.abs(cols[i] - startCols[i]);
        }

        const currentRes = getEncodedValue(cols, currentC);

        if (currentC < minC) {
            minC = currentC;
            bestResult = currentRes;
        } else if (currentC === minC) {
            // Tie-break: "largest pre-modulus value"
            if (currentRes > bestResult) {
                bestResult = currentRes;
            }
        }
        return;
    }

    for (let c = 0; c < N; c++) {
        if (usedCol[c] || diag1[row - c + N] || diag2[row + c]) continue;
        cols[row] = c;
        usedCol[c] = true; diag1[row - c + N] = true; diag2[row + c] = true;
        backtrack(row + 1);
        usedCol[c] = false; diag1[row - c + N] = false; diag2[row + c] = false;
    }
}

backtrack(0);

// Apply modulo only at the very end for the output
console.log(Number(bestResult % MOD));