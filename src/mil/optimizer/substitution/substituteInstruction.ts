import { Arithmetic, Instruction, Copy, Goto, GotoSubcommand } from "../../ast/instructions.js";
import { NumberConstant } from "../../ast/storage.js";
import { Compare } from "../../ast/subcommands.js";
import { substituteArithmetic } from "./substituteArithmetic.js";
import { substituteCompare } from "./substituteCompare.js";

export function substituteInstruction(instruction: Instruction): Instruction|undefined {
	if (instruction instanceof Copy) return substituteCopy(instruction);
	if (instruction instanceof Goto) return substituteGoto(instruction);
	return instruction;
}

function substituteCopy(instruction: Copy): Instruction|undefined {
	// remove assignment to self.
	if (instruction.dst.sameAs(instruction.src)) return undefined;
		
	// substitute expressions
	let newSrc: Copy["src"]|undefined;
	if (instruction.src instanceof Arithmetic) newSrc = substituteArithmetic(instruction.src);
	if (instruction.src instanceof Compare) newSrc = substituteCompare(instruction.src);
	if (!newSrc) return instruction;
	
	return new Copy(instruction.dst, newSrc);
}

function substituteGoto(instruction: Goto): Instruction|undefined {
	let changed = false;

	const newSubcommands: GotoSubcommand[] = [];
	for (const subcommand of instruction.subcommands) {
		if (subcommand instanceof Compare) {
			// substitute compare condition
			const newSubcommand = substituteCompare(subcommand);
			newSubcommands.push(newSubcommand || subcommand);
			if (newSubcommand) changed = true;
			continue;
		}

		if (subcommand instanceof NumberConstant) {
			// entire instruction is redundant if there are falsy conditions.
			if (subcommand.value === 0) return undefined;

			// truthy conditions are redundant.
			if (subcommand.value !== 0) {
				changed = true;
				continue;
			}
			newSubcommands.push(subcommand);
		}
	}


	return changed ? new Goto(newSubcommands, instruction.block) : instruction;
}
