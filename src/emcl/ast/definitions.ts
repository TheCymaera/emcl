import { Context } from "../compilation/Compiler.js";
import { ASTNode, Type, Value } from "./astNode.js";
import { NamespaceValue } from "./untypedValues/NamespaceValue.js";
import { VoidValue } from "./typedValues/void.js";
import * as linter from "../linter";
import { FunctionValue } from "./untypedValues/FunctionValue.js";

export class Scope implements ASTNode {
	constructor(
		public child: ASTNode,
	) {}
	
	async compile(ctx: Context) {
		ctx.symbolTable.enterScope();
		const out = await this.child.compile(ctx);
		ctx.symbolTable.exitScope();
		return out;
	}
}

export class Identifier implements ASTNode {
	constructor(
		public name: string,
	) {}
	
	async compile(ctx: Context) {
		const out = ctx.symbolTable.get(this.name);
		if (!out) throw ctx.semanticError(`"${this.name}" is undefined.`);
		return out;
	}
}

export class DeclareAlias implements ASTNode {
	constructor(
		public name: string,
		public value: ASTNode,
	) {}
	
	async compile(ctx: Context) {
		const value = await this.value.compile(ctx);
		if (ctx.symbolTable.hasInScope(this.name)) throw ctx.semanticError(`"${this.name}" is already defined in this scope.`);
		ctx.symbolTable.set(this.name, value);
		return new VoidValue;
	}
}

export class DefineMCFunction implements ASTNode {
	constructor(
		public namespacedId: string,
		public block: ASTNode,
	) {}
	
	async compile(ctx: Context) {
		const issue = linter.namespacedId.lint(this.namespacedId);
		if (issue) ctx.compilation.compiler.console.warn(issue);


		const functionCtx = new Context(
			ctx.compilation, 
			ctx.moduleURI, 
			this.namespacedId, 
			ctx.symbolTable
		);
		await this.block.compile(functionCtx);
		return new VoidValue;
	}
}

export class ImportModule implements ASTNode {
	constructor(
		public uri: string,
		public namespace: string|undefined,
	) {}

	async compile(ctx: Context) {
		if (!ctx.symbolTable.isGlobal()) {
			throw ctx.semanticError(`Import statements can only be used on the top-level.`);
		}

		const uri = ctx.moduleURI.clone().appendString(this.uri);
		if (!uri) ctx.semanticError(`"${this.uri}" is not a valid path.`);
		
		const module = await ctx.compilation.importModule(uri, ctx.branchName);
		
		if (this.namespace) {
			if (ctx.symbolTable.hasInScope(this.namespace)) throw ctx.semanticError(`"${this.namespace}" is already declared in this scope.`);
			ctx.symbolTable.set(this.namespace, new NamespaceValue(module.exports));
		}

		return new VoidValue;
	}
}

export class ExportValue implements ASTNode {
	constructor(
		public identifier: string,
		public value: ASTNode,
	) {}

	async compile(ctx: Context) {
		if (!ctx.symbolTable.isGlobal()) {
			throw ctx.semanticError(`Export statements can only be used on the top-level.`);
		}

		const module = ctx.currentModule();
		if (module.exports.has(this.identifier)) throw ctx.semanticError(`"${this.identifier}" is already declared as an exported.`);
		module.exports.set(this.identifier, await this.value.compile(ctx))
		return new VoidValue;
	}
}

export class DeclareVariable implements ASTNode {
	constructor(
		public type: Type,
		public identifier: string,
		public value: ASTNode,
	) {}
	
	async compile(ctx: Context) {
		if (ctx.symbolTable.hasInScope(this.identifier)) throw ctx.semanticError(`"${this.identifier}" is already declared in this scope.`);
		
		this.type.validateModifiers(ctx);

		const initializer = await this.value.compile(ctx);
		const value = this.type.initialize(ctx, initializer, { preferredName: this.identifier });
		ctx.symbolTable.set(this.identifier, value);
		
		return value;
	}
}

export class DeclareFunction implements ASTNode {
	constructor(
		public type: Type,
		public name: string,
		public parameters: Map<string|number, FunctionParameter>,
		public block: ASTNode,
	) { }

	async compile(ctx: Context): Promise<Value> {
		// create parameters
		const parameters: Map<string|number, Value> = new Map;
		for (const [position, parameter] of this.parameters) {
			const value = parameter.type.createVariable(ctx, { preferredName: parameter.name });
			ctx.symbolTable.set(parameter.name, value);
			parameters.set(position, value);
		}

		// create return value
		const returnValue = this.type.createVariable(ctx, { preferredName: "returnValue" });

		const branchCtx = new Context(
			ctx.compilation, 
			ctx.moduleURI, 
			ctx.compilation.suggestBranchName("branch"), 
			ctx.symbolTable
		);

		ctx.symbolTable.set(this.name, new FunctionValue(parameters, returnValue, this.type, branchCtx.branchName));

		ctx.symbolTable.enterScope();
		ctx.symbolTable.set("*return", returnValue);
		await this.block.compile(branchCtx);
		ctx.symbolTable.exitScope();

		return new VoidValue;
	}
}

export class FunctionParameter {
	constructor(
		public type: Type,
		public name: string,
	) {}
}

export class ReturnValue implements ASTNode {
	constructor(
		public value: ASTNode,
	) {}

	async compile(ctx: Context): Promise<Value> {
		const value = await this.value.compile(ctx);
		const returnValue = ctx.symbolTable.get("*return");
		if (!returnValue) {
			throw ctx.semanticError("Return statements can only be used inside functions!");
		}

		value.assignToVariable(ctx, returnValue);
		return new VoidValue;
	}
}
