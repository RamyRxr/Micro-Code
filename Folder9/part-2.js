const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").split("\n");

const TARGET = parseInt(lines[0].split(": ")[1]);
const WORD = lines[1].split(": ")[1].trim();
const matrix = lines.slice(3).filter(l => l.length > 0);
const ROWS = matrix.length;
const COLS = matrix[0].length;

const positions = WORD.split("").map(ch => {
    const pts = [];
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            if (matrix[r][c] === ch) pts.push([r, c]);
    return pts;
});

const L = WORD.length;
let sequence = null;

function search(idx, prevCol, checksumSoFar, path) {
    if (idx === L) {
        if (checksumSoFar === TARGET) sequence = [...path];
        return;
    }
    for (const [r, c] of positions[idx]) {
        if (c <= prevCol) continue;
        path.push([r, c]);
        search(idx + 1, c, checksumSoFar + (r - c), path);
        path.pop();
        if (sequence) return;
    }
}
search(0, -1, 0, []);

function toroidalDist(r1, c1, r2, c2) {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    return Math.min(dr, ROWS - dr) + Math.min(dc, COLS - dc);
}

let payload = "";

for (let i = 0; i < L; i++) {
    const [r1, c1] = sequence[i];
    const ch = WORD[i];

    let bestDist = Infinity;
    let bestR = Infinity, bestC = Infinity;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (matrix[r][c] !== ch) continue;
            if (r === r1 && c === c1) continue;      
            if (c === 0 || c === COLS - 1) continue; 

            const d = toroidalDist(r1, c1, r, c);
            if (d < bestDist || (d === bestDist && (r < bestR || (r === bestR && c < bestC)))) {
                bestDist = d;
                bestR = r;
                bestC = c;
            }
        }
    }

    payload += matrix[bestR][bestC - 1];
    payload += matrix[bestR][bestC + 1];
}

let value = 0;
for (let k = 0; k < payload.length; k++) {
    value += payload.charCodeAt(k) * (k + 1);
}

console.log(value);