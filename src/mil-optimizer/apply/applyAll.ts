import { Program } from "mil";
import { applyDeadTemporaryRemoval } from "./applyDeadTemporaryRemoval.js";
import { applyInlining } from "./applyInlining.js";
import { applyJoinInstructions } from "./applyJoinInstructions.js";
import { applySubstitution } from "./applySubstitution.js";
import { applyValuePropagation } from "./applyValuePropagation.js";
import { Changes } from "./Changes.js";

export function applyAll(program: Program) {
	let changes: Changes; 

	changes = applyInlining(program);
	if (!changes.isEmpty()) return changes;

	changes = applySubstitution(program);
	if (!changes.isEmpty()) return changes;

	changes = applyDeadTemporaryRemoval(program);
	if (!changes.isEmpty()) return changes;

	changes = applyJoinInstructions(program);
	if (!changes.isEmpty()) return changes;
	
	changes = applyValuePropagation(program);
	if (!changes.isEmpty()) return changes;

	return undefined;
}