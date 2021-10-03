import * as mil from "../../../mil/mil.js";
import { Context } from "../../Compiler.js";
import { Type, Address, Value, ToSubcommands } from "../astNode.js";

export class MCSubcommandType extends Type {
	constructor() { super(true, true); }
	
	displayName(): string {
		return "mcsubcommand";
	}

	sameAs(type: Type): boolean {
		return type instanceof MCSubcommandType;
	}

	toSubcommands(ctx: Context, address: Address) {
		return new ToSubcommands([
			new mil.MCSubcommand((address as MCSubcommandAddress).subcommand)
		]);
	}

	alloc(): never {
		throw new Error(`Cannot allocate a mcsubcommand`);
	}

	copy(ctx: Context, destination: Address, source: Address) {
		throw new Error(`Cannot assign to mcsubcommand`);
	}

	static value(subcommand: string) {
		return new Value(new MCSubcommandType, new MCSubcommandAddress(subcommand));
	}
}

export class MCSubcommandAddress extends Address {
	constructor(
		public subcommand: string,
	) { super(); }
}