const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const hexPos = {
  '0':[0,0],'1':[0,1],'2':[0,2],
  '3':[1,0],'4':[1,1],'5':[1,2],
  '6':[2,0],'7':[2,1],'8':[2,2],
  '9':[3,0],'A':[3,1],'B':[3,2],
  'C':[4,0],'D':[4,1],'E':[4,2],
  'F':[5,1],'#':[5,2]
};
const hexKeys = [
  [0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2],
  [3,0],[3,1],[3,2],[4,0],[4,1],[4,2],[5,1],[5,2]
];

// TRICK: The "Engineering errata" about new keypad layout is misdirection.
// Part 2 uses the SAME old dir keypad as Part 1 (gap at 0,0)
const dirPos = { '^':[0,1],'#':[0,2],'<':[1,0],'v':[1,1],'>':[1,2] };
const dirKeys = [[0,1],[0,2],[1,0],[1,1],[1,2]];

function bfsAllPaths(start, end, validPos) {
  const validSet = new Set(validPos.map(([r,c]) => r+','+c));
  if (start[0]===end[0] && start[1]===end[1]) return ['#'];
  let current = [[start, '']];
  let found = [];
  while (current.length && found.length === 0) {
    const next = [];
    for (const [pos, path] of current) {
      for (const [dr,dc,ch] of [[-1,0,'^'],[1,0,'v'],[0,-1,'<'],[0,1,'>']]) {
        const nr=pos[0]+dr, nc=pos[1]+dc;
        if (!validSet.has(nr+','+nc)) continue;
        if (nr===end[0] && nc===end[1]) found.push(path+ch+'#');
        else next.push([[nr,nc], path+ch]);
      }
    }
    if (found.length === 0) current = next;
  }
  return found;
}

function hexPaths(from, to) { return bfsAllPaths(hexPos[from], hexPos[to], hexKeys); }
function dirPaths(from, to)  { return bfsAllPaths(dirPos[from], dirPos[to], dirKeys); }

const memo = new Map();
function minPresses(seq, depth) {
  if (depth === 0) return BigInt(seq.length);
  const key = seq+'|'+depth;
  if (memo.has(key)) return memo.get(key);
  let cur = '#', total = 0n;
  for (const ch of seq) {
    const paths = dirPaths(cur, ch);
    total += paths.map(p => minPresses(p, depth-1)).reduce((a,b) => a<b?a:b);
    cur = ch;
  }
  memo.set(key, total);
  return total;
}

function solveCode(code) {
  let cur = '#', hexSeqs = [''];
  for (const ch of code) {
    const paths = hexPaths(cur, ch);
    hexSeqs = hexSeqs.flatMap(s => paths.map(p => s+p));
    cur = ch;
  }
  return hexSeqs.map(s => minPresses(s, 25)).reduce((a,b) => a<b?a:b);
}

let total = 0n;
for (const code of lines) {
  const len = solveCode(code);
  total += len * BigInt(parseInt(code.slice(0, 3), 16)); // no +1, same as Part 1
}
console.log(total.toString());