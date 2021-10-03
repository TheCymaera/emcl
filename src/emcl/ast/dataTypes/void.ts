import { Context } from "../../Compiler.js";
import { Type, Address, Value, ToSubcommands } from "../astNode.js";

export class VoidType extends Type {
	constructor() { super(true, true); }

	sameAs(type: Type) {
		return type instanceof VoidType;
	}
	
	displayName(): string {
		return "void";
	}
	
	toSubcommands(ctx: Context): ToSubcommands {
		throw ctx.semanticError(`Cannot use void as a condition!`);
	}

	alloc()  {
		return VoidType.value();
	}

	binaryOp(ctx: Context, lhs: Value, op: string, rhs: Value): Value {
		return super.binaryOp(ctx, lhs, op, rhs);
	}

	copy(_ctx: Context, _lhs: Address, _rhs: Address) {
		// do nothing.
	}

	static value() {
		return new Value(new VoidType, new VoidAddress);
	}
}

export class VoidAddress extends Address {
	
}