const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "input.txt"), "utf8").trim().split("\n");

const T = parseInt(lines[0]);
const readings = lines.slice(1).map(Number);

const sorted = [...readings].sort((a, b) => a - b);

outer:
for (let i = 0; i < sorted.length - 2; i++) {
    const A = sorted[i];
    let j = i + 1;
    let k = sorted.length - 1;

    while (j < k) {
        const B = sorted[j];
        const C = sorted[k];
        const sum = A + B + C;

        if (sum === T) {
            const spread = Math.max(A, B, C) - Math.min(A, B, C);
            if (spread >= 1000) {
                console.log(A * B * C);
                break outer;
            }
            j++;
            k--;
        } else if (sum < T) {
            j++;
        } else {
            k--;
        }
    }
}