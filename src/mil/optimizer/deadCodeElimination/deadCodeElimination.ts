import { Instruction, Copy, Program, NumberVariable } from "../../mil.js";
import { countReferences } from "../utilities/countReferences.js";
import { SymbolTable } from "../utilities/SymbolTable.js";

/**
 * Removes temporaries that are not referenced by any other instruction.
 */
export function deadCodeElimination(program: Program) {
	const references = countReferences(program);

	let changed = false;
	for (const [name,block] of program.blocks) {
		const newBlock = eliminateDeadCodeForBlock(block, references);
		if (block !== newBlock) changed = true;
		program.blocks.set(name, newBlock);
	}

	return changed;
}

function eliminateDeadCodeForBlock(block: Instruction[], references: SymbolTable<NumberVariable,number>) {
	const newBlock: Instruction[] = [];
	let changed = false;
	for (const instruction of block) {
		if (instruction instanceof Copy) {
			// remove assignment to dead-temporary
			if (instruction.dst instanceof NumberVariable && !references.get(instruction.dst)) {
				changed = true;
				continue;
			}
		}
		newBlock.push(instruction);
	}
	return changed ? newBlock : block;
}