import { Compare } from "../Compare.js";
import { GenerationContext } from "../Program.js";
import { Score } from "../Score.js";
import * as scoreGen from "./score.js";
import * as nbtGen from "./nbt.js";
import { NBT } from "../NBT.js";
import { executeStore, ExecuteStoreValue } from "./common.js";
import { NumberConstant } from "../Constant.js";

/**
 * Write the result of a compare operation to a score.
 */
export function writeToScore(ctx: GenerationContext, score: Score, compare: Compare) {
	executeStore(ctx, scoreGen.executeStoreTarget(ctx, score), executeStoreValue(ctx, compare));
}

/**
 * Write the result of a compare operation to an NBT.
 */
export function writeToNBT(ctx: GenerationContext, nbt: NBT, compare: Compare) {
	executeStore(ctx, nbtGen.executeStoreTarget(ctx, nbt, 1), executeStoreValue(ctx, compare));
}

/**
 * Get subcommand for compare-operation.
 */
 export function subcommand(ctx: GenerationContext, compare: Compare): string {
	const resolution = Math.max(ctx.resolutionOf(compare.lhs.dataType), ctx.resolutionOf(compare.rhs.dataType));

	const lhs = scoreGen.getScaledScoreOrNumber(ctx, compare.lhs, resolution);
	const rhs = scoreGen.getScaledScoreOrNumber(ctx, compare.rhs, resolution);
	return compareScoreSubcommand(ctx, lhs, compare.op, rhs);
}


/**
 * Get execute store value for compare-operation.
 */
export function executeStoreValue(ctx: GenerationContext, compare: Compare) {
	return new ExecuteStoreValue(subcommand(ctx, compare))
}


/**
 * Get subcommand for comparing two scores. (0-2 constant scores, 0 commands)
 */
 export function compareScoreSubcommand(ctx: GenerationContext, lhs: Score|NumberConstant, op: Compare.Op, rhs: Score|NumberConstant): string {
	const lhsPointer = lhs.scorePointer(ctx);
	if (rhs instanceof NumberConstant) {
		const rhsInt = rhs.value | 0;
		switch (op) {
			case "<"	: return `if score ${lhsPointer} matches ..${rhsInt - 1}`;
			case "<="	: return `if score ${lhsPointer} matches ..${rhsInt}`;
			case ">"	: return `if score ${lhsPointer} matches ${rhsInt + 1}..`;
			case ">="	: return `if score ${lhsPointer} matches ${rhsInt}..`;
			case "=="	: return `if score ${lhsPointer} matches ${rhsInt}`;
			case "!="	: return `unless score ${lhsPointer} matches ${rhsInt}`;
		}
	} else {
		const rhsPointer = rhs.scorePointer(ctx);
		if (op === "!=") return `unless score ${lhsPointer} = ${rhsPointer}`;
		
		const compareOp = op === "==" ? "=" : op;
		return `if score ${lhsPointer} ${compareOp} ${rhsPointer}`;
	}
}