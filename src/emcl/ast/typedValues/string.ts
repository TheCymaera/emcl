import { Context } from "../../compilation/Compiler.js";
import { Type, Value } from "../astNode.js";
import { NumberValue } from "./number.js";
import * as mil from "mil";

export class StringType extends Type {
	displayName() {
		return "string";
	}

	createVariable(ctx: Context, options: Type.CreateValueOptions): Value {
		throw ctx.semanticError(`String types must be declared with "const"!`);
	}
}

export class StringValue extends Value {
	constructor(public value: string) { super(); }

	displayName() {
		return "const string";
	}

	isConst() {
		return true;
	}

	assignToConst(ctx: Context, type: Type): Value {
		if (type instanceof StringType) return this;
		return super.assignToConst(ctx, type);
	}

	binaryOp(ctx: Context, op: string, rhs: Value): Value {
		// string constant concatenation
		if (rhs instanceof StringValue) {
			if (op === "+") {
				return new StringValue(this.value + rhs.value);
			}
		}
		
		// let parent handle the error message
		return super.binaryOp(ctx, op, rhs);
	}

	subscript(ctx: Context, subscript: Value): Value {
		// integer constant
		/*if (subscript instanceof NumberValue) {
			if (typeof subscript.value === "number" && subscript.type.resolution() === 1) {
				const index = subscript.value | 0;
				const char = this.value[index]
				if (!char) throw ctx.semanticError(`String subscript is out of bounds!`);
				return new StringValue(char);
			}
		}*/

		// let parent handle the error message
		return super.subscript(ctx, subscript);
	}

	subcommand(): mil.Subcommand {
		return new mil.MCSubcommand(this.value);
	}
}