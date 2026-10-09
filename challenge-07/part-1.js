const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const P = parseInt(lines[0]);

function countBits(s) {
    let c = 0;
    for (const b of s) if (b === "1") c++;
    return c;
}

function flipBit(s, pos) {
    const arr = s.split("");
    arr[pos] = arr[pos] === "0" ? "1" : "0";
    return arr.join("");
}

function toDecimal(s) {
    return parseInt(s, 2);
}

let grandTotal = 0;

for (let g = 0; g < P; g++) {
    // Read 4 sequences for this group
    let pop = [
        lines[1 + g * 4],
        lines[2 + g * 4],
        lines[3 + g * 4],
        lines[4 + g * 4],
    ];

    let burden = 0;

    for (let gen = 1; gen <= 1000; gen++) {
        // Step 1: Selection — find First (highest strength, tie → higher index)
        const strengths = pop.map(countBits);

        let firstIdx = 0;
        for (let i = 1; i < 4; i++) {
            if (strengths[i] >= strengths[firstIdx]) firstIdx = i;
        }

        let secondIdx = -1;
        for (let i = 0; i < 4; i++) {
            if (i === firstIdx) continue;
            if (secondIdx === -1 || strengths[i] >= strengths[secondIdx]) secondIdx = i;
        }

        const first = pop[firstIdx];
        const second = pop[secondIdx];
        const sFirst = strengths[firstIdx];
        const sSecond = strengths[secondIdx];

        // Step 2: Blend point
        const split = (sFirst + sSecond) % 7 + 1;

        // Step 3: Recombination
        let off1 = first.slice(0, split) + second.slice(split);
        let off2 = second.slice(0, split) + first.slice(split);

        // Step 4: Radiation strike
        const strike = (gen * 3 + sFirst) % 8;
        off1 = flipBit(off1, strike);
        off2 = flipBit(off2, strike);

        // Step 5: Array rotation — right by gen mod 4
        const arr = [first, second, off1, off2];
        const k = gen % 4;
        const rotated = [...arr.slice(arr.length - k), ...arr.slice(0, arr.length - k)];

        pop = rotated;

        // Record sum of decimal values
        burden += pop.reduce((sum, s) => sum + toDecimal(s), 0);
    }

    grandTotal += burden;
}

console.log(grandTotal);