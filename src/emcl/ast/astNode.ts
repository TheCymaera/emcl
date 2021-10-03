import type { Context } from "../Compiler.js";
import * as mil from "../../mil/mil.js";

export abstract class ASTNode {
	abstract compile(ctx: Context): Promise<Value>;

	async compileAsSubcommands(ctx: Context): Promise<ToSubcommands> {
		const value = await this.compile(ctx);
		return value.type.toSubcommands(ctx, value.address);
	}
}

export abstract class Address {
	_() {}
}

export abstract class Type {
	constructor(
		public final: boolean,
		public constant: boolean,
	) {}

	abstract displayName(): string;
	abstract sameAs(type: Type): boolean;
	abstract toSubcommands(ctx: Context, address: Address): ToSubcommands;
	abstract alloc(ctx: Context, preferredName: string): Address;
	abstract copy(ctx: Context, destination: Address, source: Address): void;
	
	cast(ctx: Context, newType: Type, source: Address): Address {
		const message = `Cannot cast ${this.displayName()} to ${newType.displayName()}.`;
		throw ctx.semanticError(message);
	}

	binaryOp(ctx: Context, lhs: Value, op: string, rhs: Value): Value {
		const message = `${lhs.type.displayName()} ${op} ${rhs.type.displayName()} is not a valid operation`;
		throw ctx.semanticError(message);
	}

}

export class Value extends ASTNode {
	constructor(
		public type: Type,
		public address: Address,
	) { super(); }

	cast(ctx: Context, newType: Type): Value {
		if (this.type.sameAs(newType)) return this;

		const address = this.type.cast(ctx, newType, this.address);
		return new Value(newType, address);
	}

	async compile(): Promise<Value> {
		return this;
	}
}

export class ToSubcommands {
	constructor(
		public subcommands: mil.GotoSubcommand[],
	) {}
}