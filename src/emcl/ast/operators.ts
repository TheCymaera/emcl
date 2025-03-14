import { Context } from "../compilation/Compiler.js";
import { type ASTNode, Type, Value } from "./astNode.js";
import { NumberType, NumberValue } from "./typedValues/number.js";
import { AnyValue } from "./untypedValues/AnyValue.js";
import * as mil from "mil";

export class BinaryOp implements ASTNode  {
	constructor(
		public lhs: ASTNode,
		public op: string,
		public rhs: ASTNode,
	) {}

	async compile(ctx: Context) {
		const lhs = await this.lhs.compile(ctx);
		const rhs = await this.rhs.compile(ctx);
		return lhs.binaryOp(ctx, this.op, rhs);
	}

	static negative(value: ASTNode) {
		return new BinaryOp(NumberValue.constant(mil.DataType.Int, 0), "-", value)
	}

	static not(value: ASTNode) {
		return new BinaryOp(value, "!=", NumberValue.constant(mil.DataType.Int, 0));
	}
}

export class Assignment implements ASTNode  {
	constructor(
		public lhs: ASTNode,
		public op: string,
		public rhs: ASTNode,
	) {}

	async compile(ctx: Context): Promise<Value> {
		if (this.op !== "=") {
			// TODO: replace this with something better.
			return new Assignment(this.lhs, "=", new BinaryOp(this.lhs, this.op[0]!, this.rhs)).compile(ctx);
		}

		const lhs = await this.lhs.compile(ctx);
		const rhs = await this.rhs.compile(ctx);
		rhs.assignToVariable(ctx, lhs);
		return lhs;
	}

	static inc(value: ASTNode) {
		return new Assignment(value, "+=", NumberValue.constant(mil.DataType.Int, 1));
	}

	static dec(value: ASTNode) {
		return new Assignment(value, "-=", NumberValue.constant(mil.DataType.Int, 1));
	}
}

export class MemberAccess implements ASTNode  {
	constructor(
		public value: ASTNode,
		public member: string,
	) {}

	async compile(ctx: Context) {
		const value = await this.value.compile(ctx);
		return value.member(ctx, this.member);
	}
}

export class FunctionInvocation implements ASTNode  {
	constructor(
		public value: ASTNode,
		public parameters: Map<string|number, ASTNode>,
	) {}

	async compile(ctx: Context) {
		const value = await this.value.compile(ctx);
		const parameters: Map<string|number, Value> = new Map;
		for (const [position, node] of this.parameters) {
			const value = await node.compile(ctx)
			parameters.set(position, value);
		}

		return value.invokeFunction(ctx, parameters);
	}
}

export class TypeCast implements ASTNode {
	constructor(
		public type: Type,
		public value: ASTNode,
	) {}
	
	async compile(ctx: Context) {
		this.type.validateModifiers(ctx);

		const oldValue = await this.value.compile(ctx);
		return this.type.initialize(ctx, oldValue, { preferredName: "TypeCastResult" });
	}
}
