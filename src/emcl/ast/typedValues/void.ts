import { Context } from "../../compilation/Compiler.js";
import { Type, Value } from "../astNode.js";

export class VoidType extends Type {
	displayName() {
		return "void";
	}

	createVariable(ctx: Context, options: Type.CreateValueOptions): Value {
		return new VoidValue;
	}

	isInstance(value: Value): boolean {
		return value instanceof VoidValue;
	}
}

export class VoidValue extends Value {
	displayName() {
		return "void";
	}

	isConst(): boolean {
		return true;
	}
}