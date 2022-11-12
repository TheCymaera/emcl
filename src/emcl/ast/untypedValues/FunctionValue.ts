import { Context } from "src/emcl/compilation/Compiler.js";
import { Type, Value } from "../astNode.js";
import { FunctionParameterMap } from "../../compilation/utilities.js";
import * as mil from "mil";

export class FunctionValue extends Value {
	constructor(
		readonly parameters: Map<string|number, Value>,
		readonly returnValue: Value,
		readonly returnType: Type,
		readonly branchName: string,
	) { super(); }
	
	displayName(): string {
		return "function"
	}

	isConst(): boolean {
		return false;
	}

	invokeFunction(ctx: Context, parameters: Map<string | number, Value>) {
		const inputs = new FunctionParameterMap(parameters);

		for (const [name, store] of this.parameters) {
			const input = inputs.use(name);
			if (!input) {
				throw ctx.semanticError(`Parameter "${name}" is required for this function.`);
			}
			input.assignToVariable(ctx, store);
		}

		for (const [name] of inputs.unused) {
			throw ctx.semanticError(`Undefined function parameter was provided at position '${name}'.`);
		}

		ctx.appendCommand(new mil.Goto([], this.branchName))

		return this.returnType.initialize(ctx, this.returnValue, { preferredName: "returnValueCopy" });
	}
}