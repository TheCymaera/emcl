import { Context } from "../Compiler.js";
import { ASTNode, Value } from "./astNode.js";
import { NumberType } from "./dataTypes/number.js";

export class BinaryOperation extends ASTNode {
	constructor(
		public lhs: ASTNode,
		public op: string,
		public rhs: ASTNode,
	) {super();}

	async compile(ctx: Context): Promise<Value> {
		const lhs = await this.lhs.compile(ctx);
		const rhs = await this.rhs.compile(ctx);
		const result = lhs.type.binaryOp(ctx, lhs, this.op, rhs);
		return result;
	}

	static negative(node: ASTNode): BinaryOperation {
		return new BinaryOperation(NumberType.constant(0,1), "-", node);
	}

	static not(node: ASTNode): BinaryOperation {
		return new BinaryOperation(node, "!=", NumberType.constant(0,1));
	}
}

export type CompoundAssignmentOperator = "+="|"-="|"*="|"/="|"%=";

export class Assignment extends ASTNode {
	constructor(
		public lhs: ASTNode,
		public rhs: ASTNode,
	) {super();}

	async compile(ctx: Context): Promise<Value> {
		const lhs = await this.lhs.compile(ctx);
		const rhs = await this.rhs.compile(ctx);
		const rhsCasted = rhs.cast(ctx, lhs.type);
		lhs.type.copy(ctx, lhs.address, rhsCasted.address);
		return rhs;
	}

	static compound(lhs: ASTNode, op: CompoundAssignmentOperator|"=", rhs: ASTNode) {
		if (op === "=") return new Assignment(lhs, rhs);
		return new Assignment(lhs, new BinaryOperation(lhs, op[0]!, rhs));
	}

	static inc(src: ASTNode) {
		return this.compound(src, "+=", NumberType.constant(1,1));
	}

	static dec(src: ASTNode) {
		return this.compound(src, "+=", NumberType.constant(1,1));
	}
}
