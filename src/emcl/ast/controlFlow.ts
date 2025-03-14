import { Context } from "../compilation/Compiler.js";
import { type ASTNode, Value } from "./astNode.js";
import { VoidValue } from "./typedValues/void.js";
import * as mil from "mil";
import { StringValue } from "./typedValues/string.js";

export class Block implements ASTNode{
	constructor(
		public children: ASTNode[]
	) {}

	async compile(ctx: Context) {
		for (const child of this.children) await child.compile(ctx);
		return new VoidValue;
	}
}

export class If implements ASTNode {
	constructor(
		public condition: ASTNode,
		public then: ASTNode,
	) { }

	async compile(ctx: Context) {
		const branchCtx = new Context(
			ctx.compilation, 
			ctx.moduleURI, 
			ctx.compilation.suggestBranchName("branch"), 
			ctx.symbolTable
		);

		const condition = await this.condition.compile(ctx);
		ctx.appendCommand(new mil.Goto([condition.truthy(ctx)], branchCtx.branchName));

		await this.then.compile(branchCtx);

		return new VoidValue;
	}
}

export class Execute implements ASTNode {
	constructor(
		public subcommand: ASTNode,
		public then: ASTNode,
	) { }

	async compile(ctx: Context) {
		const branchCtx = new Context(
			ctx.compilation, 
			ctx.moduleURI, 
			ctx.compilation.suggestBranchName("branch"), 
			ctx.symbolTable
		);

		const subcommand = await this.subcommand.compile(ctx);
		ctx.appendCommand(new mil.Goto([subcommand.subcommand(ctx)], branchCtx.branchName));

		await this.then.compile(branchCtx);

		return new VoidValue;
	}
}

export class Loop implements ASTNode {
	constructor(
		public init: ASTNode,
		public condition: ASTNode,
		public afterthought: ASTNode,
		public then: ASTNode,
		public doWhile: boolean,
	) { }

	async compile(ctx: Context) {
		const branchCtx = new Context(
			ctx.compilation, 
			ctx.moduleURI, 
			ctx.compilation.suggestBranchName("branch"), 
			ctx.symbolTable
		);

		ctx.symbolTable.enterScope();
		{
			await this.init.compile(ctx);
			const conditions = this.doWhile ? [] : [(await this.condition.compile(ctx)).truthy(ctx)];
			ctx.appendCommand(new mil.Goto(conditions, branchCtx.branchName));
		}
		
		{
			await this.then.compile(branchCtx);
			await this.afterthought.compile(branchCtx);
			const conditions = [(await this.condition.compile(branchCtx)).truthy(branchCtx)];
			branchCtx.appendCommand(new mil.Goto(conditions, branchCtx.branchName));
		}
		ctx.symbolTable.exitScope();

		return new VoidValue;
	}
}

export class InvokeFunction implements ASTNode {
	constructor(
		public value: ASTNode,
		public parameters: Map<string|number, ASTNode>,
	) { }

	async compile(ctx: Context) {
		const value = await this.value.compile(ctx);

		const parameters: Map<string|number, Value> = new Map;
		for (const [name, value] of this.parameters) {
			parameters.set(name, await value.compile(ctx));
		}

		return value.invokeFunction(ctx, parameters);
	}
}

export class MCCommandLiteral implements ASTNode {
	constructor(public command: string) {}

	async compile(ctx: Context) {
		ctx.appendCommand(new mil.MCCommand(this.command));
		return new VoidValue;
	}
}