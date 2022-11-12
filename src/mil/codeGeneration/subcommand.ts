import { Compare } from "../Compare.js";
import { NumberConstant } from "../Constant.js";
import { MCSubcommand, Subcommand } from "../controlFlow.js";
import { DataType } from "../DataType.js";
import { GenerationContext } from "../Program.js";
import * as genCompare from "./compare.js";

export function subcommand(ctx: GenerationContext, subcommand: Subcommand) {
	if (subcommand instanceof MCSubcommand) return subcommand.command;
	if (subcommand instanceof Compare) return genCompare.subcommand(ctx, subcommand);
	return genCompare.subcommand(ctx, new Compare(subcommand, "!=", new NumberConstant(0, DataType.Int)));
}