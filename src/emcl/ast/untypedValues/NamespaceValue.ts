import { Context } from "../../compilation/Compiler.js";
import { Value } from "../astNode.js";

export class NamespaceValue extends Value {
	constructor(
		public members: ReadonlyMap<string, Value>,
	) { super(); }
	
	isConst(): boolean {
		return false;
	}
	
	displayName(): string {
		return "namespace";
	}

	member(ctx: Context, name: string): Value {
		const value = this.members.get(name);
		if (value) return value;
		return super.member(ctx, name);
	}
}