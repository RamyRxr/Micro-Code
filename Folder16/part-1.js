const fs = require('fs');
const path = require('path');

const line = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n")[0];
const parts = line.split(' ');
const S0 = BigInt(parts[0]);
const MULT = BigInt(parts[1]);
const INC = BigInt(parts[2]);
const N = BigInt(parts[3]);
const MOD64 = 2n ** 64n;

function pcgOutput(state) {
    const xorshifted = BigInt.asUintN(32, ((state >> 18n) ^ state) >> 27n);
    const rot = Number(state >> 59n);
    return BigInt.asUintN(32, (xorshifted >> BigInt(rot)) | (xorshifted << BigInt((-rot) & 31)));
}

let state = S0;
let checksum = 0n;
for (let i = 0n; i < N; i++) {
    state = (state * MULT + INC) % MOD64;
    checksum += pcgOutput(state) >> 16n;
}
console.log(checksum.toString());