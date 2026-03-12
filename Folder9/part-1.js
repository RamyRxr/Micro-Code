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


let result = null;

function search(idx, prevCol, checksumSoFar, path) {
    if (idx === L) {
        if (checksumSoFar === TARGET) result = [...path];
        return;
    }
    for (const [r, c] of positions[idx]) {
        if (c <= prevCol) continue; 
        path.push([r, c]);
        search(idx + 1, c, checksumSoFar + (r - c), path);
        path.pop();
        if (result) return; 
    }
}

search(0, -1, 0, []);

let hash = 0;
for (const [r, c] of result) {
    hash += (r + 1) * (c + 1);
}

console.log(hash);