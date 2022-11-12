import * as mil from "mil";
import { substituteArithmetic } from "./substituteArithmetic.js";
import { substituteCompare } from "./substituteCompare.js";

export enum SubstituteResult {
	Unchanged,
	Redundant,
	AlwaysFalse,
}

export function substituteInstruction(instruction: mil.Instruction): mil.Instruction | SubstituteResult.Redundant | SubstituteResult.Unchanged {
	if (instruction instanceof mil.Assignment) {
		// optimize compare
		if (instruction.rhs instanceof mil.Compare) {
			const replacement = substituteCompare(instruction.rhs);
			if (replacement) return new mil.Assignment(instruction.lhs, replacement);
		}

		// optimize arithmetic
		if (instruction.rhs instanceof mil.Arithmetic) {
			const replacement = substituteArithmetic(instruction.rhs);
			if (replacement) return new mil.Assignment(instruction.lhs, replacement);
		}

		// assignment to self is redundant.
		if (instruction.lhs.sameAs(instruction.rhs)) return SubstituteResult.Redundant;

	}

	return SubstituteResult.Unchanged;
}

export function substituteSubcommand(subcommand: mil.Subcommand): mil.Subcommand | SubstituteResult.Unchanged | SubstituteResult.Redundant | SubstituteResult.AlwaysFalse {
	if (subcommand instanceof mil.Compare) {
		const replacement = substituteCompare(subcommand);
		if (replacement) return replacement;
	}

	if (subcommand instanceof mil.NumberConstant) {
		return subcommand.value ? SubstituteResult.Redundant : SubstituteResult.AlwaysFalse;
	}

	return SubstituteResult.Unchanged;
}