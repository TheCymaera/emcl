import { Instruction, Program } from "../../mil.js";
import { substituteInstruction } from "./substituteInstruction.js";

/**
 * Replace instructions with more performant alternatives and remove redundant instructions.
 * For example:
 * 	(x = x * 0) becomes (x = 0)
 *  (x = 3 * 5) becomes (x = 15)
 * 	(x = x) is removed
 */
export function substituteProgram(program: Program): boolean {
	let changed = false;

	for (const [name, instructions] of program.blocks) {
		const newBlock: Instruction[] = [];
		for (const instruction of instructions) {
			const newInstruction = substituteInstruction(instruction);
			if (newInstruction) newBlock.push(newInstruction);
			if (instruction !== newInstruction) changed = true;
		}
		program.blocks.set(name, newBlock);
	}

	return changed;
}

