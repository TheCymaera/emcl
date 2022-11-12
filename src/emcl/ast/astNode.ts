import { Context, SemanticError } from "../compilation/Compiler.js";
import * as mil from "mil";

export interface ASTNode {
	compile(ctx: Context): Promise<Value>
}

export abstract class Type {
	constructor(
		public isConst = false,
		public isFinal = false,
	) {};

	/**
	 * Display name used for errors and warnings.
	 */
	abstract displayName(): string;

	/**
	 * Create a non-constant variable.
	 */
	abstract createVariable(ctx: Context, options: Type.CreateValueOptions): Value;
	
	/**
	 * Initialize value.
	 */
	initialize(ctx: Context, initializer: Value, options: Type.CreateValueOptions): Value {
		if (this.isConst) {
			if (!initializer.isConst()) throw ctx.semanticError(`Cannot initialize a constant with a non constant value`);
			return initializer.assignToConst(ctx, this);
		}

		if (this.isFinal && initializer.isConst()) {
			return initializer.assignToConst(ctx, this);
		}

		const value = this.createVariable(ctx, options);
		initializer.assignToVariable(ctx, value);
		return value;
	}

	/**
	 * Display name with modifiers, used for errors and warnings.
	 */
	fullDisplayName() {
		const prefix = this.isConst ? "const " : (this.isFinal ? "final " : "");
		return prefix + this.displayName();
	}

	/**
	 * Validate modifiers
	 */
	validateModifiers(ctx: Context) {
		if (this.isFinal && this.isConst) throw ctx.semanticError(`Types cannot be declared with both "final" and "const"!`);
	}
}

export namespace Type {
	export interface CreateValueOptions {
		preferredName: string;
	}
}

export abstract class Value implements ASTNode {
	async compile() { 
		return this;
	}
	/**
	 * Display name used for errors and warnings.
	 */
	abstract displayName(): string;
	/**
	 * Check if value is a constant.
	 */
	abstract isConst(): boolean;
	/**
	 * Convert value to a constant.
	 */
	assignToConst(ctx: Context, type: Type): Value {
		throw ctx.semanticError(`Cannot assign '${this.displayName()}' to '${type.fullDisplayName()}'!`);
	}
	/**
	 * Assign value to a different value.
	 */
	assignToVariable(ctx: Context, destination: Value): void {
		throw ctx.semanticError(`Cannot assign '${this.displayName()}' to '${destination.displayName()}'!`);
	}
	/**
	 * Binary operation.
	 */
	binaryOp(ctx: Context, op: string, rhs: Value): Value {
		throw ctx.semanticError(`'${this.displayName()}' ${op} '${rhs.displayName()}' is not a valid operation!`);
	}
	/**
	 * Subscript (e.g. value[subscript])
	 */
	subscript(ctx: Context, subscript: Value): Value {
		throw ctx.semanticError(`Cannot use '${subscript.displayName()}' as a subscript of '${this.displayName()}'!`);
	}
	/**
	 * Member access (e.g. value.member)
	 */
	member(ctx: Context, property: string): Value {
		throw ctx.semanticError(`'${property}' is not a member of '${this.displayName()}'!`);
	}
	/**
	 * Use value as condition.
	 */
	truthy(ctx: Context): mil.Subcommand {
		throw ctx.semanticError(`'${this.displayName()}' cannot be tested for truthiness!`);
	}
	/**
	 * Use value as a subcommand
	 */
	subcommand(ctx: Context): mil.Subcommand {
		throw ctx.semanticError(`'${this.displayName()}' cannot be used as an execute-subcommand!`);
	}
	/**
	 * Invoke value as function
	 */
	invokeFunction(ctx: Context, parameters: Map<number|string, Value>): Value {
		throw ctx.semanticError(`'${this.displayName()}' cannot be called as a function!`);
	}
}