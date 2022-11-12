import { Value } from "src/emcl/ast/astNode.js";
import { VoidValue } from "src/emcl/ast/typedValues/void.js";
import { Context } from "../compilation/Compiler.js";
import { Module } from "../compilation/Module.js";
import * as mil from "mil";
import { StringValue } from "src/emcl/ast/typedValues/string.js";
import { FunctionParameter } from "../ast/definitions.js";
import { FunctionParameterMap } from "../compilation/utilities.js";

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
