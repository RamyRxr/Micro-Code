const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const [N, M] = lines[0].split(" ").map(Number);
const edges = [];
for (let i = 1; i <= M; i++) {
    const [a, b, w] = lines[i].split(" ").map(Number);
    edges.push([a, b, w]);
}

const INF = Infinity;
const adj = Array.from({ length: N }, () => []);
for (const [a, b, w] of edges) adj[a].push([b, w]);

// Kosaraju's SCC
const visited = new Array(N).fill(false);
const order = [];
function dfs1(start) {
    const stack = [[start, 0]];
    visited[start] = true;
    while (stack.length) {
        const [u, i] = stack[stack.length - 1];
        if (i < adj[u].length) {
            stack[stack.length - 1][1]++;
            const [v] = adj[u][i];
            if (!visited[v]) { visited[v] = true; stack.push([v, 0]); }
        } else { order.push(u); stack.pop(); }
    }
}
for (let i = 0; i < N; i++) if (!visited[i]) dfs1(i);

const radj = Array.from({ length: N }, () => []);
for (const [a, b, w] of edges) radj[b].push([a, w]);

const comp = new Array(N).fill(-1);
let numSCC = 0;
function dfs2(start, c) {
    const stack = [start];
    comp[start] = c;
    while (stack.length) {
        const u = stack.pop();
        for (const [v] of radj[u]) if (comp[v] === -1) { comp[v] = c; stack.push(v); }
    }
}
for (let i = order.length - 1; i >= 0; i--)
    if (comp[order[i]] === -1) dfs2(order[i], numSCC++);

// Min cycle weight per SCC using Dijkstra within SCC
class MinHeap {
    constructor() { this.h = []; }
    push(x) {
        this.h.push(x);
        let i = this.h.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.h[p][0] <= this.h[i][0]) break;
            [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p;
        }
    }
    pop() {
        const top = this.h[0], last = this.h.pop();
        if (this.h.length) {
            this.h[0] = last; let i = 0;
            while (true) {
                let s = i, l = 2*i+1, r = 2*i+2;
                if (l < this.h.length && this.h[l][0] < this.h[s][0]) s = l;
                if (r < this.h.length && this.h[r][0] < this.h[s][0]) s = r;
                if (s === i) break;
                [this.h[s], this.h[i]] = [this.h[i], this.h[s]]; i = s;
            }
        }
        return top;
    }
    get size() { return this.h.length; }
}

const sccNodes = Array.from({ length: numSCC }, () => []);
for (let i = 0; i < N; i++) sccNodes[comp[i]].push(i);

const sccWeight = new Array(numSCC).fill(INF);
for (let c = 0; c < numSCC; c++) {
    for (const src of sccNodes[c]) {
        const dist = new Array(N).fill(INF);
        const pq = new MinHeap();
        for (const [v, w] of adj[src]) {
            if (comp[v] === c && dist[v] > w) { dist[v] = w; pq.push([w, v]); }
        }
        while (pq.size) {
            const [d, u] = pq.pop();
            if (d > dist[u]) continue;
            if (u === src) { sccWeight[c] = Math.min(sccWeight[c], d); break; }
            for (const [v, w] of adj[u]) {
                if (comp[v] === c && dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w; pq.push([dist[v], v]);
                }
            }
        }
        if (dist[src] < INF) sccWeight[c] = Math.min(sccWeight[c], dist[src]);
    }
}

// Condensation DAG + longest path DP
const dagAdj = Array.from({ length: numSCC }, () => new Set());
const indegree = new Array(numSCC).fill(0);
for (const [a, b] of edges) {
    if (comp[a] !== comp[b] && !dagAdj[comp[a]].has(comp[b])) {
        dagAdj[comp[a]].add(comp[b]);
        indegree[comp[b]]++;
    }
}

// dp[i] = [chainLength, totalWeight] for longest chain ending at SCC i
const dp = Array.from({ length: numSCC }, (_, i) =>
    sccWeight[i] < INF ? [1, sccWeight[i]] : [0, 0]);

const queue = [];
for (let i = 0; i < numSCC; i++) if (indegree[i] === 0) queue.push(i);
let qi = 0;
while (qi < queue.length) {
    const u = queue[qi++];
    for (const v of dagAdj[u]) {
        if (dp[u][0] > 0 && sccWeight[v] < INF) {
            const nc = dp[u][0] + 1, nw = dp[u][1] + sccWeight[v];
            if (nc > dp[v][0] || (nc === dp[v][0] && nw > dp[v][1])) dp[v] = [nc, nw];
        }
        if (--indegree[v] === 0) queue.push(v);
    }
}

let bestCount = 0, bestWeight = 0;
for (const [cnt, w] of dp) {
    if (cnt > bestCount || (cnt === bestCount && w > bestWeight)) {
        bestCount = cnt; bestWeight = w;
    }
}

console.log(bestWeight);