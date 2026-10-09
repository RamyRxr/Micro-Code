import sys
import os
from itertools import combinations, product

def solve(input_file):
    with open(input_file) as f:
        lines = [line.strip() for line in f.read().split('\n') if line.strip()]

    I, G = map(int, lines[0].split())
    inputs = list(map(int, lines[1].split()))

    gates = []
    for i in range(G):
        parts = lines[2 + i].split()
        gtype, in1, in2, out = parts[0], int(parts[1]), int(parts[2]), int(parts[3])
        gates.append([gtype, in1, in2, out])

    target = list(map(int, lines[2 + G].split()))
    K = len(target)

    GATE_TYPES = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR']

    def gate_out(gtype, a, b):
        if gtype == 'AND':    return a & b
        elif gtype == 'OR':   return a | b
        elif gtype == 'XOR':  return a ^ b
        elif gtype == 'NAND': return 0 if (a == 1 and b == 1) else 1  # true NAND
        elif gtype == 'NOR':  return 1 if (a | b) == 0 else 0
        elif gtype == 'XNOR': return 1 if a == b else 0               # true XNOR

    def simulate(gate_list):
        wire = {}
        for i, v in enumerate(inputs):
            wire[i] = v
        out_ids = []
        for gtype, in1, in2, out in gate_list:
            wire[out] = gate_out(gtype, wire[in1], wire[in2])
            out_ids.append(out)
        return [wire[out_ids[-K + j]] for j in range(K)]

    # Already correct?
    if simulate(gates) == target:
        print(0)
        return

    # Build reverse lookup: wire -> gate index
    wire_to_gate = {g[3]: i for i, g in enumerate(gates)}

    # Find all gate indices that are ancestors of the output wires
    gate_out_ids = [g[3] for g in gates]
    output_wires = gate_out_ids[-K:]

    def get_ancestors(wire_ids):
        ancestors = set()
        frontier = set(wire_ids)
        while frontier:
            next_frontier = set()
            for w in frontier:
                if w in wire_to_gate:
                    gi = wire_to_gate[w]
                    if gi not in ancestors:
                        ancestors.add(gi)
                        next_frontier.add(gates[gi][1])
                        next_frontier.add(gates[gi][2])
            frontier = next_frontier
        return sorted(ancestors)

    relevant = get_ancestors(output_wires)

    # BFS over number of changes, only within relevant gates
    for num_changes in range(1, len(relevant) + 1):
        best_sig = None
        for combo in combinations(relevant, num_changes):
            original_types = [gates[i][0] for i in combo]
            for new_types in product(GATE_TYPES, repeat=num_changes):
                if all(new_types[j] == original_types[j] for j in range(num_changes)):
                    continue
                for idx, nt in zip(combo, new_types):
                    gates[idx][0] = nt
                if simulate(gates) == target:
                    sig = num_changes * 1000000 + sum(gates[i][3] for i in combo)
                    if best_sig is None or sig < best_sig:
                        best_sig = sig
                for idx, ot in zip(combo, original_types):
                    gates[idx][0] = ot
        if best_sig is not None:
            print(best_sig)
            return

default_input = os.path.join(os.path.dirname(__file__), 'input.txt')
solve(sys.argv[1] if len(sys.argv) > 1 else default_input)