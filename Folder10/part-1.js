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

class MinHeap {
    constructor() { this.h = []; }
    push(item) {
        this.h.push(item);
        let i = this.h.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.h[p][0] <= this.h[i][0]) break;
            [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
            i = p;
        }
    }
    pop() {
        const top = this.h[0];
        const last = this.h.pop();
        if (this.h.length) {
            this.h[0] = last;
            let i = 0;
            while (true) {
                let s = i, l = 2 * i + 1, r = 2 * i + 2;
                if (l < this.h.length && this.h[l][0] < this.h[s][0]) s = l;
                if (r < this.h.length && this.h[r][0] < this.h[s][0]) s = r;
                if (s === i) break;
                [this.h[s], this.h[i]] = [this.h[i], this.h[s]];
                i = s;
            }
        }
        return top;
    }
    get size() { return this.h.length; }
}

function dijkstra(src, adj, skipEdgeA = -1, skipEdgeB = -1, skipEdgeIdx = -1) {
    const dist = new Array(N).fill(INF);
    dist[src] = 0;
    const pq = new MinHeap();
    pq.push([0, src]);
    while (pq.size) {
        const [d, u] = pq.pop();
        if (d > dist[u]) continue;
        for (const [v, w, idx] of adj[u]) {
            if (idx === skipEdgeIdx) continue;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push([dist[v], v]);
            }
        }
    }
    return dist;
}

const adj = Array.from({ length: N }, () => []);
for (let i = 0; i < edges.length; i++) {
    const [a, b, w] = edges[i];
    adj[a].push([b, w, i]);
}

let best = INF;


for (const [a, b, w, ,] of edges.map((e, i) => [...e, i])) {
    const dist = dijkstra(b, adj);
    if (dist[a] < INF) best = Math.min(best, w + dist[a]);
}

for (let i = 0; i < edges.length; i++) {
    const [a, b, w] = edges[i];
    const dist = dijkstra(a, adj, -1, -1, i);
    if (dist[b] < INF) best = Math.min(best, w + dist[b]);
}

console.log(best);