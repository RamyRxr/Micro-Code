const fs = require("fs");
const path = require("path");

function applyGate(gtype, a, b) {
    if (gtype === "AND") return a & b;
    if (gtype === "OR") return a | b;
    if (gtype === "XOR") return a ^ b;
    if (gtype === "NAND") return 1 - (a & b);
    if (gtype === "NOR") return 1 - (a | b);
    if (gtype === "XNOR") return 1 - (a ^ b);
    return 0;
}

function solve(filepath) {
    const lines = fs.readFileSync(filepath, "utf8").replace(/\r/g, "").split("\n");
    const numInputs = Number(lines[0].split(/\s+/)[0]);
    const numGates = Number(lines[0].split(/\s+/)[1]);
    const inputsVals = lines[1].trim().split(/\s+/).map(Number);

    const gates = [];
    for (let i = 2; i < 2 + numGates; i++) {
        const parts = lines[i].trim().split(/\s+/);
        gates.push([parts[0], Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    }

    const target = lines[2 + numGates].trim().split(/\s+/).map(Number);
    const outputWires = [];
    for (let w = gates[gates.length - target.length][3]; w <= gates[gates.length - 1][3]; w++) {
        outputWires.push(w);
    }

    const allTypes = ["AND", "OR", "XOR", "NAND", "NOR", "XNOR"];

    const wireBase = {};
    for (let i = 0; i < inputsVals.length; i++) {
        wireBase[i] = inputsVals[i];
    }
    for (const [gtype, in1, in2, out] of gates) {
        wireBase[out] = applyGate(gtype, wireBase[in1], wireBase[in2]);
    }

    const baseOut = outputWires.map(w => wireBase[w]);

    if (baseOut.length === target.length && baseOut.every((v, i) => v === target[i])) {
        return 0;
    }

    const mismatchPos = [];
    for (let i = 0; i < target.length; i++) {
        if (baseOut[i] !== target[i]) mismatchPos.push(i);
    }

    function resimulateFrom(idx, newType) {
        const g = gates[idx];
        const wire = { ...wireBase };
        wire[g[3]] = applyGate(newType, wire[g[1]], wire[g[2]]);
        for (let j = idx + 1; j < numGates; j++) {
            const gg = gates[j];
            wire[gg[3]] = applyGate(gg[0], wire[gg[1]], wire[gg[2]]);
        }
        return outputWires.map(w => wire[w]);
    }

    for (let idx = 0; idx < numGates; idx++) {
        for (const gt of allTypes) {
            if (gt === gates[idx][0]) continue;
            const out = resimulateFrom(idx, gt);
            if (out.length === target.length && out.every((v, i) => v === target[i])) {
                return 1 * 1000000 + idx;
            }
        }
    }

    const mismatchSet = new Set(mismatchPos);
    const beneficial = new Map();

    for (let idx = 0; idx < numGates; idx++) {
        for (const gt of allTypes) {
            if (gt === gates[idx][0]) continue;
            const out = resimulateFrom(idx, gt);

            const fixed = new Set();
            let broken = false;
            for (let i = 0; i < target.length; i++) {
                if (mismatchSet.has(i) && out[i] === target[i]) fixed.add(i);
                if (!mismatchSet.has(i) && out[i] !== target[i]) {
                    broken = true;
                    break;
                }
            }

            if (fixed.size > 0 && !broken) {
                if (!beneficial.has(idx) || fixed.size > beneficial.get(idx).size) {
                    beneficial.set(idx, fixed);
                }
            }
        }
    }

    let bestSum = Infinity;
    const blist = Array.from(beneficial.entries());
    for (let i = 0; i < blist.length; i++) {
        for (let j = i + 1; j < blist.length; j++) {
            const idx1 = blist[i][0];
            const fixed1 = blist[i][1];
            const idx2 = blist[j][0];
            const fixed2 = blist[j][1];

            const union = new Set([...fixed1, ...fixed2]);
            let coversAll = true;
            for (const pos of mismatchSet) {
                if (!union.has(pos)) {
                    coversAll = false;
                    break;
                }
            }

            if (coversAll) {
                const s = idx1 + idx2;
                if (s < bestSum) bestSum = s;
            }
        }
    }

    return 2 * 1000000 + bestSum;
}

const filepath = process.argv[2] || path.join(__dirname, "input.txt");
console.log(solve(filepath));