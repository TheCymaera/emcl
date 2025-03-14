import { type ASTNode, Value } from "../ast/astNode.js";
import { VoidValue } from "../ast/typedValues/void.js";
import * as parserPipeline from "./parserPipeline.js";

export interface Module {
	parseResult: parserPipeline.ParseResult;
	ast: ASTNode;
	exports: Map<string, Value>;
}

export namespace Module {
	export function empty(): Module {
		return {
			parseResult: {
				source: "",
				tokens: [],
				tokenMap: new WeakMap,
				lexicalErrors: [],
				syntaxError: [],
				treeBuilderError: [],
				ast: undefined,
			},
			ast: new VoidValue,
			exports: new Map,
		}
	}
}