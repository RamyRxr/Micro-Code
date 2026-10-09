const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [gridSizeStr, mySymbol, depthStr] = lines[0].split(";");
const GRID = parseInt(gridSizeStr);
const DEPTH = parseInt(depthStr);
const OPP = mySymbol === "X" ? "O" : "X";

const board = [];
for (let r = 0; r < GRID; r++) {
    board.push(lines[1 + r].split(""));
}

function checkWin(b, sym) {
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (b[r][c] !== sym) continue;
            // horizontal
            if (c + 3 < GRID && b[r][c + 1] === sym && b[r][c + 2] === sym && b[r][c + 3] === sym) return true;
            // vertical
            if (r + 3 < GRID && b[r + 1][c] === sym && b[r + 2][c] === sym && b[r + 3][c] === sym) return true;
            // diagonal down-right
            if (r + 3 < GRID && c + 3 < GRID && b[r + 1][c + 1] === sym && b[r + 2][c + 2] === sym && b[r + 3][c + 3] === sym) return true;
            // diagonal down-left
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

for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
        if (board[r][c] !== ".") continue;
        board[r][c] = mySymbol;
        const val = minimax(board, DEPTH - 1, false);
        board[r][c] = ".";

        const pos = r * GRID + c;
        if (val > bestVal || (val === bestVal && pos < bestPos)) {
            bestVal = val;
            bestPos = pos;
        }
    }
}

console.log(bestPos);