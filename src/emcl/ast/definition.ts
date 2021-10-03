import { Context } from "../Compiler.js";
import { ASTNode, Type, Value } from "./astNode.js";
import { VoidType } from "./dataTypes/void.js";

export class Scope extends ASTNode {
	constructor(
		public child: ASTNode,
	) {super();}

	async compile(ctx: Context) {
		ctx.enterScope();
		const out = await this.child.compile(ctx);
		ctx.exitScope();
		return out;
	}
}

export class Identifier extends ASTNode {
	constructor(
		public identifier: string,
	) { super(); }

	async compile(ctx: Context) {
		return ctx.resolveIdentifier(this.identifier);
	}
}

export class DeclareVariable extends ASTNode {
	constructor(
		public type: Type,
		public identifier: string,
		public initializer: ASTNode,
	) { super(); }

	async compile(ctx: Context) {
		const address = this.type.alloc(ctx, this.identifier);
		const initValue = await this.initializer.compile(ctx);
		const initValueCasted = initValue.cast(ctx, this.type);

		if (this.type.constant) {
			ctx.defineIdentifier(this.identifier, initValueCasted);
		} else {
			this.type.copy(ctx, address, initValueCasted.address);
			ctx.defineIdentifier(this.identifier, new Value(this.type, address));
		}

		return VoidType.value();
	}
}

export class DeclareAlias extends ASTNode {
	constructor(
		public identifier: string,
		public value: ASTNode,
	) { super(); }

	async compile(ctx: Context) {
		const value = await this.value.compile(ctx);
		ctx.defineIdentifier(this.identifier, value);
		return VoidType.value();
	}
}

export class DefineMCFunction extends ASTNode {
	constructor(
		public namespacedId: string,
		public block: ASTNode,
	) { super(); }

	async compile(ctx: Context) {
		await ctx.compileToFunction(this.namespacedId, this.block);
		return VoidType.value();
	}
}