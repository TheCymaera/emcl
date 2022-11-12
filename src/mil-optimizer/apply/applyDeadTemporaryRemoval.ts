import * as mil from "mil";
import { Occurrences } from "../utilities/Occurrences.js";
import { Changes } from "./Changes.js";

export function applyDeadTemporaryRemoval(program: mil.Program) {
	const changes = new Changes("Dead temporary removal");
	const occurrences = Occurrences.get(program);
	for (const [name, block] of program.branches) {
		for (const [i,instruction] of block.entries()) {
			if (instruction instanceof mil.Assignment) {
				// only remove if it is never read.
				if (occurrences.get(instruction.lhs)) continue;

				// only remove temporaries
				if (!instruction.lhs.isTemporary()) continue;

				block.splice(i, 1);
				changes.addRemoved("Removed assignment to unused temporary", [instruction]);
			}
		}
	}
	return changes;
}