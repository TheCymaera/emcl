import { Arithmetic } from "../Arithmetic.js";
import { Compare } from "../Compare.js";
import { Constant, NumberConstant } from "../Constant.js";
import { NumberType } from "../DataType.js";
import { NBT } from "../NBT.js";
import { GenerationContext } from "../Program.js";
import { Score } from "../Score.js";
import { executeStore, ExecuteStoreTarget, ExecuteStoreValue } from "./common.js";
import * as genScore from "./score.js";
import * as genArithmetic from "./arithmetic.js";
import * as genCompare from "./compare.js";

export function set(ctx: GenerationContext, store: NBT, value: Constant|NBT|Score|Arithmetic|Compare) {
	if (value instanceof Arithmetic) return genArithmetic.writeToNBT(ctx, store, value);
	if (value instanceof Compare) return genCompare.writeToNBT(ctx, store, value);
	if (value instanceof Score) return setMultipliedScore(ctx, store, value, 1);

	if (value instanceof Constant) {
		// if both sides are numbers, cast the constant and copy.
		if (NumberType.isNumber(store.dataType) && value instanceof NumberConstant) {
			return copyNBT(ctx, store, new NumberConstant(value.value, store.dataType));
		}

		// otherwise, copy directly.
		return copyNBT(ctx, store, value);
	}

	if (value instanceof NBT) {
		if (store.dataType !== value.dataType) {
			// if both sides are numbers but the types don't match, use a cast assignment
			if (NumberType.isNumber(store.dataType) && NumberType.isNumber(value.dataType)) {
				return setMultipliedNBT(ctx, store, value, 1);
			}
		}
		// otherwise, copy directly.
		return copyNBT(ctx, store, value);
	}
}


/**
 * Set NBT with multiplied NBT (1 command)
 */
export function setMultipliedNBT(ctx: GenerationContext, store: NBT, value: NBT, multiplier: number): void {
	const resolution = ctx.resolutionOf(value.dataType);
	const lhs = executeStoreTarget(ctx, store, 1/resolution);
	const rhs = executeStoreValue(ctx, value, resolution * multiplier);
	executeStore(ctx, lhs, rhs);
}

/**
 * Set NBT with multiplied score (1 command)
 */
export function setMultipliedScore(ctx: GenerationContext, store: NBT, value: Score, multiplier: number): void {
	const lhs = executeStoreTarget(ctx, store, multiplier);
	const rhs = genScore.executeStoreValue(ctx, value);
	executeStore(ctx, lhs, rhs);
}

/**
 * Set NBT with NBT (0-1 command)
 */
export function copyNBT(ctx: GenerationContext, store: NBT, value: NBT|Constant): void {
	if (value instanceof Constant) {
		ctx.appendCommand(`data modify ${store.nbtPointer(ctx)} set value ${value.nbtLiteral()}`);
	} else {
		if (store.sameTargetAs(value)) return;
		ctx.appendCommand(`data modify ${store.nbtPointer(ctx)} set from ${value.nbtPointer(ctx)}`);
	}
}

/**
 * Remove NBT (1 command)
 */
export function remove(ctx: GenerationContext, store: NBT): void {
	ctx.appendCommand(`data remove ${store.nbtPointer(ctx)}`);
}

/**
 * Get NBT as execute-store target
 */
export function executeStoreTarget(ctx: GenerationContext, store: NBT, multiplier: number) {
	return new ExecuteStoreTarget(`${store.nbtPointer(ctx)} ${store.dataType} ${multiplier}`);
}

/**
 * Get NBT as execute-store value
 */
export function executeStoreValue(ctx: GenerationContext, store: NBT|Constant, multiplier: number) {
	return new ExecuteStoreValue(`run data get ${store.nbtPointer(ctx)} ${multiplier}`);
}