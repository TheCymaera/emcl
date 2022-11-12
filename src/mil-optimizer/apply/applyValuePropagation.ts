import * as mil from "mil";
import { propagateInstruction, propagateSubcommand } from "../valuePropagation/propagate.js";
import { ValueTable } from "../utilities/ValueTable.js";
import { Changes } from "./Changes.js";
import { Occurrences } from "../utilities/Occurrences.js";

export function applyValuePropagation(program: mil.Program): Changes {
	const changes = new Changes("Value Propagation");
	
	for (const [, block] of program.branches) {
		const valueTable: ValueTable = new ValueTable;
		const occurrences = Occurrences.get(program);
		for (const [i, instruction] of block.entries()) {

			if (instruction instanceof mil.MCCommand) {
				if (!instruction.isComment()) valueTable.clear();
				continue;
			}

			if (instruction instanceof mil.Goto) {
				// insert values
				for (const [n, subcommand] of instruction.subcommands.entries()) {
					const replacement = propagateSubcommand(subcommand, valueTable, occurrences);
					if (replacement) {
						const newInstruction = instruction.clone();
						newInstruction.subcommands[n] = replacement;
						block[i] = newInstruction;
						changes.addReplaced("Inserted known values into subcommand.\n\n" + valueTable.displayText(), [instruction], [newInstruction]);
						break;
					}
				}

				// update table
				valueTable.clear();
				continue;
			}

			// insert values
			const replacement = propagateInstruction(instruction, valueTable, occurrences);
			if (replacement) {
				block[i] = replacement;
				changes.addReplaced("Inserted known values into instruction.\n\n" + valueTable.displayText(), [instruction], [replacement]);
				break;
			}

			// update table
			if (instruction instanceof mil.Assignment) {
				// insert values
				valueTable.assign(instruction.lhs, instruction.rhs);
				continue;
			}
		}
	}

	return changes;
}

