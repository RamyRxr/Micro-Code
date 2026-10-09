const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [N1, K1, N2, K2] = lines[0].split(' ').map(Number);
const allTiles = lines[1].split(' ').map(Number);

const tiles = allTiles.slice(0, N2);

const prefix = [0];
for (const x of tiles) prefix.push(prefix[prefix.length - 1] + x);

const INF = Infinity;
const dp = Array.from({ length: N2 + 1 }, () => new Array(K2 + 1).fill(INF));
dp[0][0] = 0;

for (let k = 1; k <= K2; k++) {
    for (let i = k; i <= N2; i++) {
        for (let j = k - 1; j < i; j++) {
            if (dp[j][k - 1] === INF) continue;
            const S = prefix[i] - prefix[j];
            const stress = S ** 2; 
            dp[i][k] = Math.min(dp[i][k], dp[j][k - 1] + stress);
        }
    }
}

console.log(dp[N2][K2]);