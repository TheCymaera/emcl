import { Compare } from "../Compare.js";
import { Constant, NumberConstant } from "../Constant.js";
import { Arithmetic } from "../Arithmetic.js";
import { NBT } from "../NBT.js";
import { GenerationContext } from "../Program.js";
import { Score } from "../Score.js";
import { executeStore, ExecuteStoreTarget, ExecuteStoreValue } from "./common.js";
import * as genNBT from "./nbt.js";
import * as genArithmetic from "./arithmetic.js";
import * as genCompare from "./compare.js";

export function set(ctx: GenerationContext, store: Score, value: Constant|NBT|Score|Arithmetic|Compare) {
	if (value instanceof Arithmetic) return genArithmetic.writeToScore(ctx, store, value);
	if (value instanceof Compare) return genCompare.writeToScore(ctx, store, value);
	if (value instanceof Score) return operation(ctx, store, "=", value);

	if (value instanceof Constant || value instanceof NBT) {
		if (value instanceof NumberConstant) {
			return operation(ctx, store, "=", value);
		}

		return setMultipliedNBT(ctx, store, value, 1);
	}
}

/**
 * Create scoreboard objective (1 command)
 */
export function createObjective(ctx: GenerationContext, objective: string, displayName: string): void {
	ctx.appendCommand(`scoreboard objectives add ${objective} dummy ${JSON.stringify(displayName)}`);
}

/**
 * Remove scoreboard objective (1 command)
 */
export function removeObjective(ctx: GenerationContext, objective: string) {
	ctx.appendCommand(`scoreboard objectives remove ${objective}`);
}

/**
 * Perform arithmetic operation on score. (0-1 commands)
 */
export function operation(ctx: GenerationContext, lhs: Score, op: Arithmetic.Op|"=", rhs: Score|NumberConstant): void {
	// ignore redundant
	if (lhs.sameTargetAs(rhs)) return;
	if (op === "+" || op === "-") if (NumberConstant.equals(rhs, 0)) return;
	if (op === "*" || op === "/") if (NumberConstant.equals(rhs, 1)) return;

	if (rhs instanceof NumberConstant && rhs.value < 0) {
		// flip negative numbers to minimize constant-scores
		switch (op) {
			case "+": return operation(ctx, lhs, "-", NumberConstant.double(-rhs.value));
			case "-": return operation(ctx, lhs, "+", NumberConstant.double(-rhs.value));
		}
	}
	if (rhs instanceof NumberConstant && -1 < rhs.value && rhs.value < 1) {
		// invert numbers between -1 and 1 to minimize data loss.
		switch (op) {
			case "*": return operation(ctx, lhs, "/", NumberConstant.double(1/rhs.value));
			case "/": return operation(ctx, lhs, "*", NumberConstant.double(1/rhs.value));
		}
	}

	const lhsPointer = lhs.scorePointer(ctx);

	if (rhs instanceof NumberConstant) {
		const rhsInt = Math.round(rhs.value);
		switch (op) {
			case "=": return ctx.appendCommand(`scoreboard players set ${lhsPointer} ${rhsInt}`);
			case "+": return ctx.appendCommand(`scoreboard players add ${lhsPointer} ${rhsInt}`);
			case "-": return ctx.appendCommand(`scoreboard players remove ${lhsPointer} ${rhsInt}`);
		}
	}

	const rhsPointer = rhs.scorePointer(ctx);
	const assignmentOp = op === "=" ? "=" : (op + "=");
	return ctx.appendCommand(`scoreboard players operation ${lhsPointer} ${assignmentOp} ${rhsPointer}`);
}

/**
 * Set score from multiplied NBT (1 command)
 */
export function setMultipliedNBT(ctx: GenerationContext, store: Score, value: NBT|Constant, multiplier: number) {
	executeStore(ctx, executeStoreTarget(ctx, store), genNBT.executeStoreValue(ctx, value, multiplier));
}

/**
 * Returns a multiplied score or number. (0-2 commands)
 */
export function getScaledScoreOrNumber(ctx: GenerationContext, value: NBT|Score|NumberConstant, scale: number): Score|NumberConstant {
	if (value instanceof Score) {
		if (scale === 1) return value;
		const ac = ctx.ac();
		operation(ctx, ac, "=", value);
		operation(ctx, ac, "*", NumberConstant.double(scale));
		return ac;
	}

	if (value instanceof NBT) {
		const ac = ctx.ac();
		executeStore(ctx, executeStoreTarget(ctx, ac), genNBT.executeStoreValue(ctx, value, scale))
		return ac;
	}

	return NumberConstant.double(value.value * scale);
}

/**
 * Multiplies a value and writes it to a score. (1-2 commands)
 */
export function writeScaledScore(ctx: GenerationContext, target: Score, value: NBT|Score|NumberConstant, scale: number) {
	if (value instanceof Score) {
		operation(ctx, target, "=", value);
		operation(ctx, target, "*", NumberConstant.double(scale));
	}

	if (value instanceof NBT) {
		executeStore(ctx, executeStoreTarget(ctx, target), genNBT.executeStoreValue(ctx, value, scale));
	}

	if (value instanceof NumberConstant) {
		operation(ctx, target, "=", NumberConstant.double(value.value * scale));
	}
}

/**
 * Get score as execute-store target
 */
 export function executeStoreTarget(ctx: GenerationContext, score: Score) {
	return new ExecuteStoreTarget(`score ${score.scorePointer(ctx)}`);
}

/**
 * Get score as execute-store value
 */
export function executeStoreValue(ctx: GenerationContext, score: Score): ExecuteStoreValue {
	return new ExecuteStoreValue(`run scoreboard players get ${score.scorePointer(ctx)}`);
}