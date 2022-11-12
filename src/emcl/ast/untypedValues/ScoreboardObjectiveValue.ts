import { Context } from "src/emcl/compilation/Compiler.js";
import { Value } from "../astNode.js";
import { StringValue } from "../typedValues/string.js";
import * as mil from "mil";
/*
export class ScoreboardObjectiveValue extends Value {
	constructor(
		public objective: string
	) { super(); }

	displayName() {
		return "scoreboardObjective";
	}

	subscript(ctx: Context, value: Value) {
		if (value instanceof StringValue) {
			return new AnyValue(new mil.Score(this.objective, value.value))
		}

		return super.subscript(ctx, value);
	}
}*/