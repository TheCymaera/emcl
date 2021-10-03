import { ASTNode, Value } from "./astNode.js";
import type { Context } from "../Compiler.js";
import { StringAddress } from "./dataTypes/string";
import * as mil from "../../mil/mil.js";
import { VoidType } from "./dataTypes/void.js";
import { MCSubcommandType } from "./dataTypes/mcsubcommand.js";

export class ImportModule extends ASTNode {
	constructor(
		public uri: string,
	) { super(); }

	async compile(ctx: Context) {
		if (!ctx.isGlobal()) throw ctx.semanticError(`Import statements can only be used in the global scope.`);
		await ctx.importModule(ctx.moduleURI.clone().appendString(this.uri));
		return VoidType.value();
	}
}

export class Block extends ASTNode {
	constructor(
		public children: ASTNode[],
	) { super(); }

	async compile(ctx: Context) {
		for (const child of this.children) {
			await child.compile(ctx);
		}
		return VoidType.value();
	}
}

export class Execute extends ASTNode {
	constructor(
		public subcommand: ASTNode,
		public then: ASTNode,
	) { super(); }

	async compile(ctx: Context) {
		const thenId = await ctx.compileToNamelessFunction(this.then);
		const subcommands = await this.subcommand.compileAsSubcommands(ctx);

		ctx.out.push(new mil.Goto(subcommands.subcommands, thenId));

		return VoidType.value();
	}
}

export class Loop extends ASTNode {
	constructor(
		public init: ASTNode,
		public subcommand: ASTNode,
		public afterthought: ASTNode,
		public then: ASTNode,
		public doWhile: boolean,
	) { super(); }

	async compile(ctx: Context) {
		await this.init.compile(ctx);

		const thenBlockId = await ctx.compileToNamelessFunction(this.then);
		await ctx.compileToFunction(thenBlockId, this.afterthought);

		const execute = new Execute(this.subcommand, new CallMCFunction(thenBlockId))
		await ctx.compileToFunction(thenBlockId, execute);

		if (this.doWhile) {
			await execute.then.compile(ctx);
		} else {
			await execute.compile(ctx);
		}

		return VoidType.value();
	}
}

export class CallMCFunction extends ASTNode {
	constructor(
		public name: string,
	) { super(); }

	compile(ctx: Context) {
		ctx.out.push(new mil.Goto([], this.name));
		return VoidType.value();
	}
}

export class MCCommand extends ASTNode {
	constructor(
		readonly child: ASTNode,
	) { super(); }

	async compile(ctx: Context): Promise<Value> {
		const child = await this.child.compile(ctx);
		if (!(child.address instanceof StringAddress)) throw ctx.semanticError(`Cannot use "${child.type.displayName()}" as mccommand.`);
		
		ctx.out.push(new mil.MCCommand(child.address.value));
		return VoidType.value();
	}
}

export class MCSubcommand extends ASTNode {
	constructor(
		readonly child: ASTNode,
	) { super(); }

	async compile(ctx: Context): Promise<Value> {
		const child = await this.child.compile(ctx);
		if (!(child.address instanceof StringAddress)) throw ctx.semanticError(`Cannot use "${child.type.displayName()}" as mcsubcommand.`);
		
		return MCSubcommandType.value(child.address.value);
	}
}