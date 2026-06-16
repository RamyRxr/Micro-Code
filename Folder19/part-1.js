const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [I, G] = lines[0].split(" ").map(Number);
const inputs = lines[1].split(" ").map(Number);

const gates = [];
for (let i = 0; i < G; i++) {
    const parts = lines[2 + i].split(" ");
    const gtype = parts[0];
    const in1 = parseInt(parts[1]);
    const in2 = parseInt(parts[2]);
    const out = parseInt(parts[3]);
    gates.push([gtype, in1, in2, out]);
}

const K = gates.length > 0 ? (() => {
    const target = lines[2 + G].split(" ").map(Number);
    return target.length;
})() : 0;

function gateOut(gtype, a, b) {
    switch (gtype) {
        case 'AND':  return a & b;
        case 'OR':   return a | b;
        case 'XOR':  return a ^ b;
        case 'NAND': return (a === 1 && b === 1) ? 0 : 1;
        case 'NOR':  return (a | b) === 0 ? 1 : 0;
        case 'XNOR': return a === b ? 1 : 0;
    }
}

function simulate(gateList) {
    const wire = {};
    for (let i = 0; i < inputs.length; i++) wire[i] = inputs[i];
    const outIds = [];
    for (const [gtype, in1, in2, out] of gateList) {
        wire[out] = gateOut(gtype, wire[in1], wire[in2]);
        outIds.push(out);
    }
    const outputVals = Array.from({ length: K }, (_, j) => wire[outIds[outIds.length - K + j]]);
    return outputVals;
}

const outputVals = simulate(gates);

// Encode as binary number: O_1 * 2^(K-1) + ... + O_K * 2^0
let result = 0;
for (let i = 0; i < K; i++) {
    result += outputVals[i] * Math.pow(2, K - 1 - i);
}

console.log(result);