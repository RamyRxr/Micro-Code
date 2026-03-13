const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [N1, K1] = lines[0].split(' ').map(Number);
const tiles = lines[1].split(' ').map(Number).slice(0, N1);

const prefix = [0];
for (const x of tiles) prefix.push(prefix[prefix.length - 1] + x);

const INF = Infinity;
const dp = Array.from({ length: N1 + 1 }, () => new Array(K1 + 1).fill(INF));
dp[0][0] = 0;

for (let k = 1; k <= K1; k++) {
    for (let i = k; i <= N1; i++) {
        for (let j = k - 1; j < i; j++) {
            if (dp[j][k - 1] === INF) continue;
            const S = prefix[i] - prefix[j];
            const stress = S ** 2; 
            dp[i][k] = Math.min(dp[i][k], dp[j][k - 1] + stress);
        }
    }
}

console.log(dp[N1][K1]);