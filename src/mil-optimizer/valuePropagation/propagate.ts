import * as mil from "mil";
import { type ReadonlyOccurrences } from "../utilities/Occurrences.js";
import { type ReadonlyValueTable } from "../utilities/ValueTable.js";

export function propagateInstruction(instruction: mil.Instruction, values: ReadonlyValueTable, referenceCount: ReadonlyOccurrences): mil.Instruction|undefined {
	if (instruction instanceof mil.Assignment) {
		const occurrences = referenceCount.get(instruction.rhs as mil.Store);
		const replacement = propagateValue(instruction.rhs, values, occurrences === 1);

		if (replacement) return new mil.Assignment(instruction.lhs, replacement);
	}

	return undefined;
}

export function propagateSubcommand(subcommand: mil.Subcommand, values: ReadonlyValueTable, referenceCount: ReadonlyOccurrences): mil.Subcommand|undefined {
	if (subcommand instanceof mil.MCSubcommand) return;

	const occurrences = referenceCount.get(subcommand as mil.Store);
	const replacement = propagateValue(subcommand, values, occurrences === 1);

	if (mil.Subcommand.isSubcommand(replacement)) return replacement;
	return undefined;
}

export function propagateValue(value: mil.Value, values: ReadonlyValueTable, moveExpressions: boolean) {
	if (value instanceof mil.Compare) return propagateCompare(value, values);
	if (value instanceof mil.Arithmetic) return propagateArithmetic(value, values);
	
	const out = values.get(value as mil.Store);
	if (out && !moveExpressions && mil.Value.movable(out)) return undefined;
	return out;
}

export function propagateCompare(compare: mil.Compare, values: ReadonlyValueTable): mil.Compare|undefined {
	const lhsValue = values.get(compare.lhs as mil.Store);
	const rhsValue = values.get(compare.rhs as mil.Store);

	const newLHS = mil.Compare.isOperand(lhsValue) ? lhsValue : undefined;
	const newRHS = mil.Compare.isOperand(rhsValue) ? rhsValue : undefined;

	if (newLHS || newRHS) {
		return new mil.Compare(newLHS || compare.lhs, compare.op, newRHS || compare.rhs);
	}

	return undefined;
}

export function propagateArithmetic(arithmetic: mil.Arithmetic, values: ReadonlyValueTable): mil.Arithmetic|undefined {
	const lhsValue = values.get(arithmetic.lhs as mil.Store);
	const rhsValue = values.get(arithmetic.rhs as mil.Store);

	const newLHS = mil.Arithmetic.isOperand(lhsValue) ? lhsValue : undefined;
	const newRHS = mil.Arithmetic.isOperand(rhsValue) ? rhsValue : undefined;

	if (newLHS || newRHS) {
		return new mil.Arithmetic(newLHS || arithmetic.lhs, arithmetic.op, newRHS || arithmetic.rhs);
	}

	return undefined;
}

export function propagateTwoAddressArithmetic(arithmetic: mil.Arithmetic, values: ReadonlyValueTable): mil.Arithmetic|undefined {
	return undefined;
}