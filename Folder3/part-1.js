const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "./input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const MOD = 2n ** 32n;
const stack = [];

const u32 = (n) => ((BigInt(n) % MOD) + MOD) % MOD;

for (const line of lines) {
    const [op, arg] = line.trim().split(" ");

    switch (op) {
        case "push": stack.push(u32(arg)); break;
        case "pop": stack.pop(); break;

        case "dup": stack.push(stack.at(-1)); break;
        case "dup2": stack.push(stack.at(-2), stack.at(-1)); break;
        case "dup3": stack.push(stack.at(-3), stack.at(-2), stack.at(-1)); break;

        case "rol": {
            const n = +arg;
            const slice = stack.splice(-n);
            slice.unshift(slice.pop());
            stack.push(...slice);
            break;
        }

        case "xor": { const B = stack.pop(), A = stack.pop(); stack.push(u32(A ^ B)); break; }
        case "or": { const B = stack.pop(), A = stack.pop(); stack.push(u32(A | B)); break; }
        case "and": { const B = stack.pop(), A = stack.pop(); stack.push(u32(A & B)); break; }
        case "sub": { const B = stack.pop(), A = stack.pop(); stack.push(u32(A - B)); break; }
        case "sum": { const B = stack.pop(), A = stack.pop(); stack.push(u32(A + B)); break; }
        case "shl": { const B = stack.pop(), A = stack.pop(); stack.push(u32(A << (B & 31n))); break; }
        case "shr": { const B = stack.pop(), A = stack.pop(); stack.push(u32(BigInt.asUintN(32, A) >> (B & 31n))); break; }

        case "inc": stack.push(u32(stack.pop() + 1n)); break;
        case "dec": stack.push(u32(stack.pop() - 1n)); break;
        case "not": stack.push(u32(BigInt.asUintN(32, ~stack.pop()))); break;
    }
}

console.log(stack.reduce((acc, val) => u32(acc ^ val), 0n).toString());