import { Goto, MCCommand, Program } from "mil";
import { substituteInstruction, SubstituteResult, substituteSubcommand } from "../substitution/substitute.js";
import { Changes } from "./Changes.js";

/**
 * Applies substitution optimizations to a program.
 */
export function applySubstitution(program: Program): Changes {
	const change = new Changes("Substitution");

	for (const [, block] of program.branches) {
		for (const [i, instruction] of block.entries()) {
			if (instruction instanceof MCCommand) {
				continue;
			}

			if (instruction instanceof Goto) {
				for (const [n, subcommand] of instruction.subcommands.entries()) {
					const substitute = substituteSubcommand(subcommand);

					// remove instruction
					if (substitute === SubstituteResult.AlwaysFalse) {
						block.splice(i, 1);
						change.addRemoved("Removed jump with a falsy condition", [instruction]);
						continue;
					}

					// remove subcommand
					if (substitute === SubstituteResult.Redundant) {
						const newInstruction = instruction.clone();
						newInstruction.subcommands.splice(n, 1);
						block[i] = newInstruction;
						change.addReplaced("Removed redundant subcommand", [instruction], [newInstruction]);
						continue;
					}

					// replace subcommand
					if (substitute !== SubstituteResult.Unchanged) {
						const newInstruction = instruction.clone();
						newInstruction.subcommands[n] = substitute;
						block[i] = newInstruction;
						change.addReplaced("Replaced subcommand", [instruction], [newInstruction]);
						continue;
					}
				}
				continue;
			}

			const substitute = substituteInstruction(instruction);
			// remove instruction
			if (substitute === SubstituteResult.Redundant) {
				block.splice(i, 1);
				change.addRemoved("Removed redundant instruction", [instruction]);
				continue;
			}
			
			// replace instruction
			if (substitute !== SubstituteResult.Unchanged) {
				block[i] = substitute;
				change.addReplaced("Replaced instruction", [instruction], [substitute]);
				continue;
			}
		}
	}

	return change;
}