import { GenerationContext } from "../Program.js";

/**
 * Runs an execute-store command. 
 * For the purposes of typechecking, the parameters use classes.
 */
export function executeStore(ctx: GenerationContext, target: ExecuteStoreTarget, value: ExecuteStoreValue) {
	ctx.appendCommand(`execute store result ${target.executeStoreTarget} ${value.executeStoreValue}`);
}

export class ExecuteStoreValue {
	constructor(readonly executeStoreValue: string) {}
}

export class ExecuteStoreTarget {
	constructor(readonly executeStoreTarget: string) {}
}