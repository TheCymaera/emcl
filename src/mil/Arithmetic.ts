import { NumberConstant } from "./Constant.js";
import { NumberType } from "./DataType.js";
import { NBT } from "./NBT.js";
import { Score } from "./Score.js";

export class Arithmetic {
	constructor(
		public lhs: Arithmetic.Operand,
		public op: Arithmetic.Op,
		public rhs: Arithmetic.Operand,
	) {}

	displayText() {
		return `${this.lhs.displayText()} ${this.op} ${this.rhs.displayText()}`;
	}
}

export namespace Arithmetic {
	export type Op = "+"|"-"|"*"|"/"|"%";

	export type Operand = Score|NBT|NumberConstant;

	export function isOperand(operand: unknown): operand is Operand {
		return operand instanceof Score || operand instanceof NBT || operand instanceof NumberConstant;
	}

	export function calc(lhs: number, op: Op, rhs: number) {
		switch(op) {
			case "+": return lhs + rhs;
			case "-": return lhs - rhs;
			case "*": return lhs * rhs;
			case "/": return lhs / rhs;
			case "%": return lhs % rhs;
		}
	}

	export function calcNumberConstant(lhs: NumberConstant, op: Op, rhs: NumberConstant) {
		const returnType = NumberType.maxSpecificity(lhs.dataType, rhs.dataType);
		return new NumberConstant(calc(lhs.value, op, rhs.value), returnType);
	}
}