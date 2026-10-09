const fs = require("fs");
const path = require("path");

const formula = fs.readFileSync(path.join(__dirname, "input.txt"), "utf8").trim().split("\n")[0];
const VALUES = { A: 247, B: 383, C: 156, D: 512 };

let i = 0;

function parse() {
    let total = 0;

    while (i < formula.length) {
        const ch = formula[i];

        if (VALUES[ch] !== undefined) {
            total += VALUES[ch];
            i++;
        } else if (ch === "(") {
            i++;
            const groupValue = parse();
            i++;

            i++;
            let numStr = "";
            while (formula[i] !== "}") {
                numStr += formula[i++];
            }
            i++;

            total += groupValue * parseInt(numStr);
        } else if (ch === ")") {
            break;
        } else {
            i++;
        }
    }

    return total;
}

console.log(parse());