import { NumberType } from "../DataType.js";
import { GenerationContext } from "../Program.js";
import { Score } from "../Score.js";
import * as scoreGen from "./score.js";
import * as nbtGen from "./nbt.js";
import { Arithmetic } from "../Arithmetic.js";
import { NBT } from "../NBT.js";
import { NumberConstant } from "../Constant.js";

export function	writeToScore(ctx: GenerationContext, target: Score, arithmetic: Arithmetic) {
	if (arithmetic.op === "*" && arithmetic.rhs instanceof NumberConstant) {
		if (arithmetic.lhs instanceof NBT) {
			return scoreGen.setMultipliedNBT(ctx, target, arithmetic.lhs, arithmetic.rhs.value);
		}
	}

	if (arithmetic.op === "/" && arithmetic.rhs instanceof NumberConstant) {
		if (arithmetic.lhs instanceof NBT) {
			return scoreGen.setMultipliedNBT(ctx, target, arithmetic.lhs, 1/arithmetic.rhs.value);
		}
	}

	// the "_writeToAccumulator" function will pollute the target during calculation.
	// if the RHS is also the target, we need to write the result to an accumulator and assign
	// to the target afterwards.
	if (!target.sameTargetAs(arithmetic.rhs)) {
		_writeToAccumulator(ctx, target, arithmetic);
	} else {
		const ac = ctx.ac();
		_writeToAccumulator(ctx, ac, arithmetic);
		scoreGen.operation(ctx, target, "=", ac);
	}
}

export function	writeToNBT(ctx: GenerationContext, target: NBT, arithmetic: Arithmetic) {
	// ctx.appendCommand(`# DEBUG: ${target.displayText()} = ${arithmetic.displayText()}`);

	if (arithmetic.op === "*" && arithmetic.rhs instanceof NumberConstant) {
		if (arithmetic.lhs instanceof NBT) {
			return nbtGen.setMultipliedNBT(ctx, target, arithmetic.lhs, arithmetic.rhs.value);
		}
		if (arithmetic.lhs instanceof Score) {
			return nbtGen.setMultipliedScore(ctx, target, arithmetic.lhs, arithmetic.rhs.value);
		}
	}

	if (arithmetic.op === "/" && arithmetic.rhs instanceof NumberConstant) {
		if (arithmetic.lhs instanceof NBT) {
			return nbtGen.setMultipliedNBT(ctx, target, arithmetic.lhs, 1/arithmetic.rhs.value);
		}
		if (arithmetic.lhs instanceof Score) {
			return nbtGen.setMultipliedScore(ctx, target, arithmetic.lhs, 1/arithmetic.rhs.value);
		}
	}

	const lhsRes = NumberType.isNumber(arithmetic.lhs.dataType) ? ctx.resolutionOf(arithmetic.lhs.dataType) : 1;
	const rhsRes = NumberType.isNumber(arithmetic.lhs.dataType) ? ctx.resolutionOf(arithmetic.lhs.dataType) : 1;
	const maxRes = Math.max(lhsRes, rhsRes);

	const ac = ctx.ac();
	switch (arithmetic.op) {
		case "+":
		case "-":
		case "%": {
			// ac = lhs
			scoreGen.writeScaledScore(ctx, ac, arithmetic.lhs, maxRes);
			// get rhs
			const rhs = scoreGen.getScaledScoreOrNumber(ctx, arithmetic.rhs, maxRes);
			// ac += rhs
			scoreGen.operation(ctx, ac, arithmetic.op, rhs);
			// target = ac / resolution
			nbtGen.setMultipliedScore(ctx, target, ac, 1/(maxRes));
			break;
		}
		case "*": {
			// ac = lhs
			scoreGen.writeScaledScore(ctx, ac, arithmetic.lhs, lhsRes);
			// get rhs
			const rhs = scoreGen.getScaledScoreOrNumber(ctx, arithmetic.rhs, rhsRes);
			// ac *= rhs
			scoreGen.operation(ctx, ac, arithmetic.op, rhs);
			// target = ac / total_resolution
			nbtGen.setMultipliedScore(ctx, target, ac, 1/(lhsRes * rhsRes));
			break;
		}

		case "/": {
			// ac = lhs
			scoreGen.writeScaledScore(ctx, ac, arithmetic.lhs, lhsRes * rhsRes);
			// get rhs
			const rhs = scoreGen.getScaledScoreOrNumber(ctx, arithmetic.rhs, rhsRes);
			// ac /= rhs
			scoreGen.operation(ctx, ac, arithmetic.op, rhs);
			// target = ac / total_resolution
			nbtGen.setMultipliedScore(ctx, target, ac, 1/(lhsRes));
			break;
		}
	}
}

function _writeToAccumulator(ctx: GenerationContext, ac: Score, arithmetic: Arithmetic) {
	const lhsRes = NumberType.isNumber(arithmetic.lhs.dataType) ? ctx.resolutionOf(arithmetic.lhs.dataType) : 1;
	const rhsRes = NumberType.isNumber(arithmetic.lhs.dataType) ? ctx.resolutionOf(arithmetic.lhs.dataType) : 1;
	const maxRes = Math.max(lhsRes, rhsRes);

	switch (arithmetic.op) {
		case "+":
		case "-":
		case "%": {
			// ac = lhs
			scoreGen.writeScaledScore(ctx, ac, arithmetic.lhs, maxRes);
			// get rhs
			const rhs = scoreGen.getScaledScoreOrNumber(ctx, arithmetic.rhs, maxRes);
			// ac += rhs
			scoreGen.operation(ctx, ac, arithmetic.op, rhs);
			// ac /= resolution
			scoreGen.operation(ctx, ac, "/", NumberConstant.double(maxRes));
			break;
		}
		case "*": {
			// ac = lhs
			scoreGen.writeScaledScore(ctx, ac, arithmetic.lhs, lhsRes);
			// get rhs
			const rhs = scoreGen.getScaledScoreOrNumber(ctx, arithmetic.rhs, rhsRes);
			// ac *= rhs
			scoreGen.operation(ctx, ac, arithmetic.op, rhs);
			// ac /= total_resolution
			scoreGen.operation(ctx, ac, "/", NumberConstant.double(rhsRes * lhsRes));
			break;
		}

		case "/": {
			// ac = lhs
			scoreGen.writeScaledScore(ctx, ac, arithmetic.lhs, maxRes);
			// get rhs
			const rhs = scoreGen.getScaledScoreOrNumber(ctx, arithmetic.rhs, maxRes);
			// ac /= rhs
			scoreGen.operation(ctx, ac, arithmetic.op, rhs);
			// total_resolution = 1
			// do nothing.
			break;
		}
	}
}