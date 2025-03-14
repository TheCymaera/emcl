import { Context } from "../compilation/Compiler.js";
import { Module } from "../compilation/Module.js";
import * as mil from "mil";
import { FunctionParameterMap } from "../compilation/utilities.js";
import { Value } from "../ast/astNode.js";
import { StringValue } from "../ast/typedValues/string.js";
import { VoidValue } from "../ast/typedValues/void.js";

export const minecraftModule = Module.empty();

minecraftModule.exports.set("command", new class MCCommand extends Value {
	isConst(): boolean {
		return false;
	}

	displayName(): string {
		return "nativeFunction:minecraft.command";
	}

	invokeFunction(ctx: Context, parameters: Map<string | number, Value>): Value {
		const unused = new FunctionParameterMap(parameters);
		const command = unused.use(0);
		if (command instanceof StringValue) {
			ctx.appendCommand(new mil.MCCommand(command.value));
			return new VoidValue;
		}
		
		throw ctx.semanticError(`"${this.displayName()}" must be invoked with (command: const string)`);
	}
});
