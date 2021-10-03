import { Context } from "../../Compiler.js";
import { Type, Address, Value, ToSubcommands } from "../astNode.js";
import * as mil from "../../../mil/mil.js";

export class StringType extends Type {
	constructor(
		public constant: boolean,
	) { super(false, constant); }

	displayName() {
		return (this.constant ? "const " : "") + "string";
	}

	toSubcommands(ctx: Context, address: StringAddress): ToSubcommands {
		return new ToSubcommands([
			new mil.NumberConstant(address.value ? 1 : 0)
		]);
	}

	sameAs(type: Type) {
		return type instanceof StringType;
	}

	alloc(ctx: Context) {
		return new StringAddress("");
	}

	copy(ctx: Context, lhs: Address, rhs: Address) {
		throw ctx.semanticError(`String assignment is not currently supported`);
	}

	binaryOp(ctx: Context, lhs: Value, op: string, rhs: Value): Value {
		if (lhs.address instanceof StringAddress && rhs.address instanceof StringAddress) {
			if (op === "+") return new Value(this, new StringAddress(lhs.address.value + rhs.address.value));
		}
		
		return super.binaryOp(ctx, lhs, op, rhs);
	}

	static constant(value: string) {
		return new Value(new StringType(true), new StringAddress(value));
	}
}

export class StringAddress extends Address {
	constructor(
		public value: string,
	) { super(); }
}