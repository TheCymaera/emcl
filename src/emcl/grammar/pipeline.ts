import { lexer } from "./lexer.js";
import { Lexer } from "../../compiler-builder/Lexer.js";
import type { Context, Module } from "../Compiler.js";
import { parser, treeBuilder } from "./parser.js";
import { Parser } from "../../compiler-builder/Parser.js";
import { VoidType } from "../ast/dataTypes/void.js";

const ignoredTokens = new Set(["COMMENT", "WHITESPACE"]);

export function pipeline(ctx: Context, source: string): Module {
	lexer.reset();
	parser.reset();
	treeBuilder.reset();

	const tokens = Lexer.joinAdjacentTokens(lexer.tokenize(source), "ILLEGAL");
	const tokenMap = Lexer.getTokensMap(tokens);

	const cleanedTokens: Lexer.Token[] = [];
	for (const token of tokens) {
		if (token.type === "ILLEGAL") {
			const map = tokenMap.get(token)!;
			const message = `Illegal token at: (${map.line}, ${map.char})`;
			ctx.compiler.console.error(message);
		} else {
			if (!ignoredTokens.has(token.type)) cleanedTokens.push(token);
		}
	}

	const actions: Parser.Action[] = [];
	for (const token of cleanedTokens) {
		if (!parser.next(token.type, actions)) {
			const map = tokenMap.get(token)!;
			const message = `Syntax Error: Unexpected token "${token.value}" at:\nline ${map.line + 1}\nchar ${map.char + 1}\nfile: ${ctx.compiler.uri.relativePathOf(ctx.moduleURI)}`;
			
			ctx.compiler.console.error(message);
			return {
				source,
				tokens,
				tokenMap,
				ast: VoidType.value(),
				syntaxError: {
					message,
					tokenIndex: tokens.indexOf(token),
				}
			}
		}
	}

	if (!parser.endOfInput(actions)) {
		const message = `Syntax Error: Unexpected end of input!`;
		ctx.compiler.console.error(message);
		return {
			source,
			tokens,
			tokenMap,
			ast: VoidType.value(),
			syntaxError: {
				message,
				tokenIndex: tokens.length,
			}
		}
	}

	try {
		return {
			source,
			tokens,
			tokenMap,
			ast: treeBuilder.buildTree(actions, cleanedTokens.map(i=>i.value)),
		}
	} catch(e) {
		const message = e.message;
		ctx.compiler.console.error(message);
		return {
			source,
			tokens,
			tokenMap,
			ast: VoidType.value(),
			syntaxError: {
				message,
				tokenIndex: tokens.length,
			}
		}
	}
}