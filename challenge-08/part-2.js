const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const parts = lines[0].split(";");
const GRID = parseInt(parts[0]);
const mySymbol = parts[1];
const DEPTH = parseInt(parts[2]);
const weightsStr = parts[3];
const OPP = mySymbol === "X" ? "O" : "X";

const scenarios = weightsStr.split("|").map(entry => {
    const [w, rc] = entry.split("-");
    const [r, c] = rc.split(",").map(Number);
    return { w: parseInt(w), r, c };
});

const board = [];
for (let r = 0; r < GRID; r++) {
    board.push(lines[1 + r].split(""));
}

function checkWin(b, sym) {
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (b[r][c] !== sym) continue;
            if (c + 3 < GRID && b[r][c + 1] === sym && b[r][c + 2] === sym && b[r][c + 3] === sym) return true;
            if (r + 3 < GRID && b[r + 1][c] === sym && b[r + 2][c] === sym && b[r + 3][c] === sym) return true;
            if (r + 3 < GRID && c + 3 < GRID && b[r + 1][c + 1] === sym && b[r + 2][c + 2] === sym && b[r + 3][c + 3] === sym) return true;
            if (r + 3 < GRID && c - 3 >= 0 && b[r + 1][c - 1] === sym && b[r + 2][c - 2] === sym && b[r + 3][c - 3] === sym) return true;
        }
    }
    return false;
}

function isFull(b) {
    for (let r = 0; r < GRID; r++)
        for (let c = 0; c < GRID; c++)
            if (b[r][c] === ".") return false;
    return true;
}

function minimax(b, depth, isMaximizing) {
    if (checkWin(b, mySymbol)) return 100;
    if (checkWin(b, OPP)) return -100;
    if (depth === 0 || isFull(b)) return 0;

    const sym = isMaximizing ? mySymbol : OPP;
    let best = isMaximizing ? -Infinity : Infinity;

    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (b[r][c] !== ".") continue;
            b[r][c] = sym;
            const val = minimax(b, depth - 1, !isMaximizing);
            b[r][c] = ".";
            if (isMaximizing) best = Math.max(best, val);
            else best = Math.min(best, val);
        }
    }
    return best;
}

let bestVal = -Infinity;
let bestPos = -1;

for (let mr = 0; mr < GRID; mr++) {
    for (let mc = 0; mc < GRID; mc++) {
        if (board[mr][mc] !== ".") continue;

        let weightedTotal = 0;

        for (const { w, r: hr, c: hc } of scenarios) {
            if (hr === mr && hc === mc) {
                weightedTotal += w * -100;
                continue;
            }

            board[hr][hc] = OPP;

            if (checkWin(board, OPP)) {
                weightedTotal += w * -100;
                board[hr][hc] = ".";
                continue;
            }

            board[mr][mc] = mySymbol;
            const outcome = minimax(board, DEPTH - 1, false);
            board[mr][mc] = ".";

            weightedTotal += w * outcome;
            board[hr][hc] = ".";
        }

        const pos = mr * GRID + mc;
        if (weightedTotal > bestVal || (weightedTotal === bestVal && pos < bestPos)) {
            bestVal = weightedTotal;
            bestPos = pos;
        }
    }
}

console.log(bestPos);