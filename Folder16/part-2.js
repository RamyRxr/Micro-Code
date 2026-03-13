const fs = require('fs');
const path = require('path');

const parts = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n")[0].split(' ');
const S0 = BigInt(parts[0]);
const MULT = BigInt(parts[1]);
const INC = BigInt(parts[2]);

const T = BigInt(parts[4]);
const P = BigInt(parts[5]);

function leapAhead(s0, mult, inc, T) {
    let accMult = 1n, accInc = 0n;
    let curMult = mult, curInc = inc;
    let t = T;
    while (t > 0n) {
        if (t & 1n) {
            accInc = BigInt.asUintN(64, accMult * curInc + accInc);
            accMult = BigInt.asUintN(64, accMult * curMult);
        }
        curInc = BigInt.asUintN(64, (curMult + 1n) * curInc);
        curMult = BigInt.asUintN(64, curMult * curMult);
        t >>= 1n;
    }
    return BigInt.asUintN(64, accMult * s0 + accInc);
}

const sT = leapAhead(S0, MULT, INC, T);
console.log((sT % P).toString());