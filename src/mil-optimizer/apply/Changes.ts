import * as mil from "mil";

/**
 * Describes a change made by the optimizer.
 */
export class Changes {
	replaced: Changes.Replaced[] = [];
	removed: Changes.Removed[] = [];

	constructor(public type: string) {}

	addReplaced(message: string, oldInstructions: mil.InstructionLike[], newInstructions: mil.InstructionLike[]) {
		this.replaced.push(new Changes.Replaced(message, oldInstructions, newInstructions))
	}

	addRemoved(message: string, oldInstructions: mil.InstructionLike[]) {
		this.removed.push(new Changes.Removed(message, oldInstructions))
	}

	isEmpty() {
		return this.replaced.length === 0 && this.removed.length === 0;
	}
}

export namespace Changes {
	export class Replaced {
		constructor(
			public message: string,
			public instructions: mil.InstructionLike[],
			public replacements: mil.InstructionLike[],
		) {}
	}

	export class Removed {
		constructor(
			public message: string,
			public instructions: mil.InstructionLike[],
		) {}
	}
}