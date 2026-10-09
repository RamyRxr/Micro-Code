const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const dishes = lines[0].split(",").map(Number);
const n = dishes.length;

const maxSingle = Math.max(...dishes);

let maxPair = 0;
for (let i = 0; i < n; i++) {
    maxPair = Math.max(maxPair, dishes[i] + dishes[(i + 1) % n]);
}
console.log(Math.max(maxSingle, maxPair));