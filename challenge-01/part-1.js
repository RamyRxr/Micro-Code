const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "input.txt"), "utf8").trim().split("\n");

const T = parseInt(lines[0]);
const readings = lines.slice(1).map(Number);

for (let i = 0; i < readings.length; i++) {
    for (let j = i + 1; j < readings.length; j++) {
        if (readings[i] + readings[j] === T && i !== j) {
            console.log(readings[i] * readings[j]);
            break;
        }
    }
}