const fs = require("fs");
const path = require("path");

const lines = fs.readFileSync(path.join(__dirname, "input.txt"), "utf8").replace(/\r/g, "").trim().split("\n");

const MOD = 2n ** 32n;
const stack = [];
let reverseFlag = false;

const u32 = (n) => ((BigInt(n) % MOD) + MOD) % MOD;

const popAB = () => {
    if (reverseFlag) { reverseFlag = false; const A = stack.pop(), B = stack.pop(); return [A, B]; }
    const B = stack.pop(), A = stack.pop(); return [A, B];
};

const react = (T) => {
    if ((T >> 31n) & 1n) stack.reverse();
    else if (T & 1n) reverseFlag = true;
};

const binop = (fn) => { const [A, B] = popAB(), r = fn(A, B); stack.push(r); react(r); };

for (const line of lines) {
    const [op, arg] = line.trim().split(" ");

    switch (op) {
        case "push": stack.push(u32(arg)); break;
        case "pop": stack.pop(); break;

        case "dup": stack.push(stack.at(-1)); break;
        case "dup2": stack.push(stack.at(-2), stack.at(-1)); break;
        case "dup3": stack.push(stack.at(-3), stack.at(-2), stack.at(-1)); break;

        case "rol": {
            const slice = stack.splice(-+arg);
            slice.unshift(slice.pop());
            stack.push(...slice);
            break;
        }

        case "xor": binop((A, B) => u32(A ^ B)); break;
        case "or": binop((A, B) => u32(A | B)); break;
        case "and": binop((A, B) => u32(A & B)); break;
        case "sub": binop((A, B) => u32(A - B)); break;
        case "sum": binop((A, B) => u32(A + B)); break;
        case "shl": binop((A, B) => u32(A << (B & 31n))); break;
        case "shr": binop((A, B) => u32(BigInt.asUintN(32, A) >> (B & 31n))); break;

        case "inc": stack.push(u32(stack.pop() + 1n)); break;
        case "dec": stack.push(u32(stack.pop() - 1n)); break;
        case "not": stack.push(u32(BigInt.asUintN(32, ~stack.pop()))); break;
    }
}

console.log(stack.reduce((acc, val) => u32(acc ^ val), 0n).toString());