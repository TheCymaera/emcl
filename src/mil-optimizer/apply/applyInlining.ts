import * as mil from "mil";
import { Changes } from "./Changes.js";

export function applyInlining(program: mil.Program): Changes {
	const changes = new Changes("Branch inlining");

	const referenceCount = new Map<string, number>();
	for (const [, branch] of program.branches) {
		for (const instruction of branch) {
			if (instruction instanceof mil.Goto) {
				referenceCount.set(instruction.branch, (referenceCount.get(instruction.branch) ?? 0) + 1);
			}
		}
	}

	for (const [branchName, branch] of program.branches) {
		const count = referenceCount.get(branchName);
		// remove branches with 0 references.
		if (!count && program.canInline(branchName)) {
			const instructions = program.branches.get(branchName)!;
			changes.addRemoved("Removed unused branch", instructions);
			program.branches.delete(branchName);
			continue;
		}

		for (const [i,goto] of branch.entries()) {
			if (!(goto instanceof mil.Goto)) continue;

			// ignore branches with conditions
			if (goto.subcommands.length > 0) continue;

			const name = goto.branch;
			const count = referenceCount.get(name);

			// inline branches with only 1 reference.
			if (count === 1 && program.canInline(name)) {
				const instructions = program.branches.get(name) ?? [];
				branch.splice(i, 1, ...instructions);
				changes.addReplaced("Inlined singleton branch", [goto], instructions);
			}
		}
	}

	return changes;
}