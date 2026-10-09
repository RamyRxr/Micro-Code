const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const P = parseInt(lines[0]);

function flipBit(s, pos) {
    const a = s.split("");
    a[pos] = a[pos] === "0" ? "1" : "0";
    return a.join("");
}

function resemblance(s, ref) {
    let diff = 0;
    for (let i = 0; i < 8; i++) if (s[i] !== ref[i]) diff++;
    return 8 - diff;
}

function countOnes(s) {
    let c = 0;
    for (const b of s) if (b === "1") c++;
    return c;
}

let grandTotal = 0;

for (let g = 0; g < P; g++) {
    let pop = [
        lines[1 + g * 4],
        lines[2 + g * 4],
        lines[3 + g * 4],
        lines[4 + g * 4],
    ];

    let ref = "11010110";
    let burden = 0;

    for (let gen = 1; gen <= 1000; gen++) {
        // Update reference key BEFORE selection
        if (gen % 100 === 0) {
            // Rule 1: rotate left by 1 (leftmost bit moves to rightmost)
            ref = ref.slice(1) + ref[0];
            // then flip bits at positions 2 and 5
            ref = flipBit(ref, 2);
            ref = flipBit(ref, 5);
        }
        if (gen % 250 === 0) {
            // Rule 2: reverse entire key (after rule 1 if both triggered)
            ref = ref.split("").reverse().join("");
        }

        // Step 1: Selection using resemblance
        const res = pop.map(s => resemblance(s, ref));

        let firstIdx = 0;
        for (let i = 1; i < 4; i++) if (res[i] >= res[firstIdx]) firstIdx = i;

        let secondIdx = -1;
        for (let i = 0; i < 4; i++) {
            if (i === firstIdx) continue;
            if (secondIdx === -1 || res[i] >= res[secondIdx]) secondIdx = i;
        }

        const first = pop[firstIdx];
        const second = pop[secondIdx];
        const rFirst = res[firstIdx];
        const rSecond = res[secondIdx];

        // Step 2: Blend point — depends on how many 1s in ref
        const ones = countOnes(ref);
        const split = ones > 4
            ? (rFirst + rSecond + 2) % 7 + 1
            : (rFirst + rSecond) % 7 + 1;

        // Step 3: Recombination
        let off1 = first.slice(0, split) + second.slice(split);
        let off2 = second.slice(0, split) + first.slice(split);

        // Step 4: Radiation strike (uses resemblance of First, not strength)
        const strike = (gen * 3 + rFirst) % 8;
        off1 = flipBit(off1, strike);
        off2 = flipBit(off2, strike);

        // Step 5: Rotation right by gen mod 4
        const arr = [first, second, off1, off2];
        const k = gen % 4;
        const rotated = [...arr.slice(arr.length - k), ...arr.slice(0, arr.length - k)];

        pop = rotated;
        burden += pop.reduce((sum, s) => sum + parseInt(s, 2), 0);
    }

    grandTotal += burden;
}

console.log(grandTotal);