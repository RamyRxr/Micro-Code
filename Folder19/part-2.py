import sys

def apply_gate(gtype, a, b):
    if gtype == 'AND':  return a & b
    if gtype == 'OR':   return a | b
    if gtype == 'XOR':  return a ^ b
    if gtype == 'NAND': return 1 - (a & b)
    if gtype == 'NOR':  return 1 - (a | b)
    if gtype == 'XNOR': return 1 - (a ^ b)

def solve(filepath):
    lines = open(filepath).read().splitlines()
    num_inputs = int(lines[0].split()[0])
    num_gates  = int(lines[0].split()[1])
    inputs_vals = list(map(int, lines[1].split()))

    gates = []
    for i in range(2, 2 + num_gates):
        parts = lines[i].split()
        gates.append((parts[0], int(parts[1]), int(parts[2]), int(parts[3])))

    target = list(map(int, lines[2 + num_gates].split()))
    output_wires = list(range(gates[-len(target)][3], gates[-1][3] + 1))

    ALL_TYPES = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR']

    # Base simulation
    wire_base = {}
    for i, v in enumerate(inputs_vals):
        wire_base[i] = v
    for (gtype, in1, in2, out) in gates:
        wire_base[out] = apply_gate(gtype, wire_base[in1], wire_base[in2])

    base_out = [wire_base[w] for w in output_wires]

    # Already correct?
    if base_out == target:
        return 0

    mismatch_pos = [i for i in range(len(target)) if base_out[i] != target[i]]

    def resimulate_from(idx, new_type):
        g = gates[idx]
        wire = dict(wire_base)
        wire[g[3]] = apply_gate(new_type, wire[g[1]], wire[g[2]])
        for j in range(idx + 1, num_gates):
            gg = gates[j]
            wire[gg[3]] = apply_gate(gg[0], wire[gg[1]], wire[gg[2]])
        return [wire[w] for w in output_wires]

    # Try single gate change
    for idx in range(num_gates):
        for gt in ALL_TYPES:
            if gt == gates[idx][0]:
                continue
            if resimulate_from(idx, gt) == target:
                return 1 * 1000000 + idx  # 0-based gate index

    # Try pairs of gate changes
    mismatch_set = frozenset(mismatch_pos)
    beneficial = {}  # gate_idx -> best fixed set
    for idx in range(num_gates):
        for gt in ALL_TYPES:
            if gt == gates[idx][0]:
                continue
            out = resimulate_from(idx, gt)
            fixed  = frozenset(i for i in mismatch_pos if out[i] == target[i])
            broken = any(i not in mismatch_pos and out[i] != target[i] for i in range(len(target)))
            if fixed and not broken:
                if idx not in beneficial or len(fixed) > len(beneficial[idx]):
                    beneficial[idx] = fixed

    best_sum = float('inf')
    blist = list(beneficial.items())
    for i in range(len(blist)):
        for j in range(i + 1, len(blist)):
            idx1, fixed1 = blist[i]
            idx2, fixed2 = blist[j]
            if fixed1 | fixed2 == mismatch_set:
                s = idx1 + idx2
                if s < best_sum:
                    best_sum = s

    return 2 * 1000000 + best_sum

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'input.txt'
    print(solve(filepath))