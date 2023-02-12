import * as codeGeneration from "./codeGeneration/index.js";
import { NumberConstant } from "./Constant.js";
import { DataType } from "./DataType.js";
import { NBT } from "./NBT.js";
import { GenerationContext } from "./Program.js";
import { Score } from "./Score.js";

export class Compare {
	constructor(
		public lhs: Compare.Operand,
		public op: Compare.Op,
		public rhs: Compare.Operand,
	) {}

	displayText() {
		return this.lhs.displayText() + " " + this.op + " " + this.rhs.displayText();
	}

	subcommand(ctx: GenerationContext) {
		return codeGeneration.compare.subcommand(ctx, this);
	}

	flip() {
		switch(this.op) {
			case "<" : return new Compare(this.rhs, ">", this.lhs);
			case ">" : return new Compare(this.rhs, "<", this.lhs);
			case "<=": return new Compare(this.rhs, ">=", this.lhs);
			case ">=": return new Compare(this.rhs, "<=", this.lhs);
			case "==": return new Compare(this.rhs, "==", this.lhs);
			case "!=": return new Compare(this.rhs, "!=", this.lhs);
		}
	}
}

export namespace Compare {
	export type Op = "<"|"<="|">"|">="|"=="|"!=";
	
	export type Operand = Score|NBT|NumberConstant;

	export function isOperand(operand: unknown): operand is Operand {
		return operand instanceof Score || operand instanceof NBT || operand instanceof NumberConstant;
	}

	export function calc(lhs: number, op: Op, rhs: number) {
		switch(op) {
			case "<"	: return +(lhs < rhs);
			case "<="	: return +(lhs <= rhs);
			case "=="	: return +(lhs === rhs);
			case ">="	: return +(lhs >= rhs);
			case ">"	: return +(lhs > rhs);
			case "!="	: return +(lhs != rhs);
		}
	}

	export function calcNumberConstant(lhs: NumberConstant, op: Op, rhs: NumberConstant) {
		return new NumberConstant(calc(lhs.value, op, rhs.value), DataType.Byte);
	}
}