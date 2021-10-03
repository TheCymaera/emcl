import { Program } from "../ast/Program.js";
import { substituteProgram } from "./substitution/substitution.js";
import { joinInstructionsProgram } from "./joinInstructions/joinInstructions.js";
import { deadCodeElimination } from "./deadCodeElimination/deadCodeElimination.js";
import { valuePropagation } from "./valuePropagation/valuePropagation.js";

export function optimize(program: Program): Program {
	let i = 0;
	while (optimizeOnce(program)) {
		if (i >= 500) {
			console.error(`Optimization exceeded ${i} cycles. This is probably a bug. Please report to a maintainer.`);
			break;
		}
		i++;
	}
	return program;
}

function optimizeOnce(program: Program): boolean {
	let changed = false;

	changed = valuePropagation(program) || changed;
	changed = substituteProgram(program) || changed;
	changed = joinInstructionsProgram(program) || changed;
	changed = deadCodeElimination(program) || changed;

	return changed;
}