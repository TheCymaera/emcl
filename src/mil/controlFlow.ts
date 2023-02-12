import { Compare } from "./Compare.js";
import { NBT } from "./NBT.js";
import { GenerationContext } from "./Program.js";
import { Score } from "./Score.js";
import * as codeGeneration from "./codeGeneration/index.js";
import { NumberConstant } from "./Constant.js";

export class Goto {
	constructor(
		public subcommands: Subcommand[],
		public branch: string,
	) {}

	clone() {
		return new Goto([...this.subcommands], this.branch);
	}

	displayText() {
		return `execute (${this.subcommands.map(i=>i.displayText()).join(" && ")}) ${JSON.stringify(this.branch)}`;
	}

	generate(ctx: GenerationContext) {
		const subcommands = this.subcommands.map(i=>codeGeneration.subcommand.subcommand(ctx, i)).join(" ");
		const main = ctx.generation.generate(this.branch);
		if (!subcommands) {
			ctx.appendCommand(main);
		} else {
			ctx.appendCommand(`execute ${subcommands} run ${main}`);
		}
	}
}

export type Subcommand = Compare|MCSubcommand|Score|NBT|NumberConstant;
export namespace Subcommand {
	export function isSubcommand(subcommand: unknown): subcommand is Subcommand {
		return subcommand instanceof Compare || subcommand instanceof MCSubcommand || subcommand instanceof Score || subcommand instanceof NBT || subcommand instanceof NumberConstant;
	}
}


export class MCCommand {
	constructor(
		public command: string,
	) {}

	displayText() {
		if (this.command[0] === "#") return this.command;
		return "/" + this.command;
	}

	isComment() {
		return this.command[0] === "#";
	}

	generate(ctx: GenerationContext) {
		ctx.appendCommand(this.command);
	}
}

export class MCSubcommand {
	constructor(
		public command: string,
	) {}

	displayText() {
		return JSON.stringify(this.command);
	}

	subcommand(ctx: GenerationContext): string {
		return this.command;
	}
}