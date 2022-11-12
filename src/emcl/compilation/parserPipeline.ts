import { lexer } from "../grammar/lexer.js";
import { Lexer } from "../../compiler-builder/Lexer.js";
import { parser, treeBuilder } from "../grammar/parser.js";
import { Parser } from "../../compiler-builder/Parser.js";
import { ASTNode } from "../ast/astNode.js";

const ignoredTokens = new Set(["COMMENT", "WHITESPACE"]);

export interface ParseResult {
	source: string;
	tokens: Lexer.Token[];
	tokenMap: WeakMap<Lexer.Token, Lexer.TokenMapItem>;
	lexicalErrors: LexicalError[];
	syntaxError: SyntaxError[],
	treeBuilderError: Error[],
	ast?: ASTNode,
}

export function pipeline(source: string, fileName: string): ParseResult {
	lexer.reset();
	parser.reset();
	treeBuilder.reset();

	const tokens = Lexer.joinAdjacentTokens(lexer.tokenize(source), "ILLEGAL");
	const tokenMap = Lexer.getTokensMap(tokens);

	const out: ParseResult = {
		source,
		tokens,
		tokenMap,
		lexicalErrors: [],
		syntaxError: [],
		treeBuilderError: [],
		ast: undefined,
	}

	const cleanedTokens: Lexer.Token[] = [];
	for (const [i,token] of tokens.entries()) {
		if (token.type === "ILLEGAL") {
			const map = tokenMap.get(token)!;
			out.lexicalErrors.push(new LexicalError(i, map))
		} else {
			if (!ignoredTokens.has(token.type)) cleanedTokens.push(token);
		}
	}

	const actions: Parser.Action[] = [];
	for (const token of cleanedTokens) {
		if (!parser.next(token.type, actions)) {
			const map = tokenMap.get(token)!;
			const message = `Syntax Error: Unexpected token "${token.value}" at:\nline ${map.line + 1}\nchar ${map.char + 1}\nfile: ${fileName}`;
			out.syntaxError.push(new SyntaxError(message, tokens.indexOf(token)));
			return out;
		}
	}

	if (!parser.endOfInput(actions)) {
		const message = `Syntax Error: Unexpected end of input!`;
		out.syntaxError.push(new SyntaxError(message, tokens.length));
		return out
	}

	try {
		const ast = treeBuilder.buildTree(actions, cleanedTokens.map(i=>i.value));
		out.ast = ast;
		return out;
	} catch(e) {
		out.treeBuilderError.push(e);
		return out;
	}
}

export class LexicalError extends Error {
	readonly tokenIndex: number;
	constructor(tokenIndex: number, map: Lexer.TokenMapItem) {
		super(`Illegal token at: (${map.line}, ${map.char})`);
		this.tokenIndex = tokenIndex;
	}
}

export class SyntaxError extends Error {
	readonly tokenIndex: number;
	constructor(message: string, tokenIndex: number) {
		super(message);
		this.tokenIndex = tokenIndex;
	}
}