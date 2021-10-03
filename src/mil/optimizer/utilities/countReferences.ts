import { Arithmetic, Copy, Goto } from "../../ast/instructions.js";
import { Program } from "../../ast/Program.js";
import { NumberVariable } from "../../ast/storage.js";
import { Compare } from "../../ast/subcommands.js";
import { SymbolTable } from "./SymbolTable.js";

export function countReferences(program: Program) {
	const out: SymbolTable<NumberVariable, number> = new SymbolTable;
	for (const [name, block] of program.blocks) {
		for (const instruction of block) {
			const references = getReferences(instruction);
			for (const ref of references) out.set(ref, (out.get(ref) || 0) + 1)
		}
	}
	return out;
}


function getReferences(node: unknown): NumberVariable[] {
	if (node instanceof Copy) return getReferences(node.src);
	if (node instanceof NumberVariable) return [node];
	if (node instanceof Compare || node instanceof Arithmetic) {
		return [...getReferences(node.lhs), ...getReferences(node.rhs)];
	}
	if (node instanceof Goto) {
		const out: NumberVariable[] = [];
		for (const cond of node.subcommands) out.push(...getReferences(cond));
		return out;
	}

	return [];
}