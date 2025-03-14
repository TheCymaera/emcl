import { Constant, NumberConstant } from "./Constant.js";
import { NBT } from "./NBT.js";
import { GenerationContext } from "./Program.js";
import { Score } from "./Score.js";
import * as codeGeneration from "./codeGeneration/index.js";
import { Arithmetic } from "./Arithmetic.js";
import { Compare } from "./Compare.js";

export type Instruction = Assignment;
export type Store = NBT|Score;

export class Assignment {
	constructor(
		public lhs: Store,
		public rhs: Value,
	) {}

	displayText(): string {
		if (this.rhs instanceof Arithmetic && this.lhs.sameTargetAs(this.rhs.lhs)) {
			return this.lhs.displayText() + " " + this.rhs.op + "= " + this.rhs.rhs.displayText()
		}
		return this.lhs.displayText() + " = " + this.rhs.displayText();
	}

	generate(ctx: GenerationContext) {
		if (this.lhs instanceof NBT) {
			codeGeneration.nbt.set(ctx, this.lhs, this.rhs);
		} else {
			codeGeneration.score.set(ctx, this.lhs, this.rhs);
		}
	}
}

export type Value = NBT|Score|Arithmetic|Compare|Constant;
export namespace Value {
	export function contains(lhs: Value, rhs: Value): boolean {
		if (lhs instanceof Score) return lhs.sameTargetAs(rhs);
		if (lhs instanceof NBT) return lhs.sameTargetAs(rhs);
		if (lhs instanceof Arithmetic) return contains(lhs.lhs, rhs) || contains(lhs.rhs, rhs);
		if (lhs instanceof Compare) return contains(lhs.lhs, rhs) || contains(lhs.rhs, rhs);
		return false;
	}

	export function movable(value: Value) {
		return value instanceof Compare || value instanceof Arithmetic;
	}

	export function getReferences(value: Value): (Score|NBT)[] {
		if (value instanceof Score) return [value];
		if (value instanceof NBT) return [value];
		if (value instanceof Arithmetic) return [...getReferences(value.lhs), ...getReferences(value.rhs)];
		if (value instanceof Compare) return [...getReferences(value.lhs), ...getReferences(value.rhs)];
		return [];
	}
}
