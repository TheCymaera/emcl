import { ASTNode, Type, Value } from "./astNode.js";
import { Context } from "../compilation/Compiler.js";
import { NumberType, NumberValue } from "./typedValues/number.js";
import * as mil from "mil";
import * as linter from "../linter/index.js";

export class ScoreReference implements ASTNode {
	constructor(
		public objective: string,
		public player: string,
	) {}

	async compile(ctx: Context) {
		// lint
		const issue = linter.scoreboard.lintObjective(this.objective);
		if (issue) ctx.compilation.compiler.console.warn(issue);

		return new NumberValue(new NumberType(mil.DataType.Int), new mil.ScorePointer(this.objective, this.player));
	}
}

export class NBTReference implements ASTNode {
	constructor(
		public type: Type,
		public kind: string,
		public target: string,
		public path: string,
	) {}

	async compile(ctx: Context) {
		// lint
		const issue = linter.nbtTarget.lint(this.kind, this.target);
		if (issue) ctx.compilation.compiler.console.warn(issue);

		const pointer = new mil.NBTPointer(this.kind, this.target, this.path, mil.DataType.Int);

		// validate
		// TODO: Fix the way typed values work so I don't have to do this.
		if (this.type instanceof NumberType) {
			return new NumberValue(this.type, pointer)
		}

		throw ctx.semanticError(`NBT pointers only support numbers currently.`);
	}
}