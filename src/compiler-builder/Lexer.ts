export class Lexer {
	config: Lexer.Config;

	index = 0;
	state: any;

	constructor(config: Lexer.Config) {
		this.config = config;
		this.reset();
	}

	reset() {
		this.index = 0;
	}

	step(string: string): Lexer.Token {
		this.config.regex.lastIndex = this.index;

		const match = this.config.regex.exec(string);
		if (!match) return this.config.errorHandler.call(this, string);

		for (let i = 1; i < match.length; i++) {
			const value = match[i];
			if (value !== undefined) {
				this.index += value.length;
				const type = this.config.types[i-1]!;
				return { value, type };
			}
		}

		throw new Error("LEXER: Encountered an unexpected error.");
	}

	tokenize(string: string): Lexer.Token[] {
		const out: Lexer.Token[] = [];
		while (this.index < string.length) out.push(this.step(string));
		return out;
	}

	static joinAdjacentTokens<T extends Lexer.Token>(tokens: T[], type: string): T[] {
		const out: T[] = [];
		for (const token of tokens) {
			const prevToken = out[out.length - 1];
			if (token.type === type && prevToken?.type === type) {
				prevToken.value += token.value
			} else {
				out.push(token);
			}
		}
		return out;
	}

	static getTokensMap(tokens: Iterable<Lexer.Token>): Map<Lexer.Token, Lexer.TokenMapItem> {
		const out: Map<Lexer.Token, Lexer.TokenMapItem> = new Map;

		let line = 0, char = 0;
		for (const token of tokens) {
			out.set(token, {line, char});

			char += token.value.length;
			const lines = token.value.split("\n");
			if (lines.length > 1) {
				line += lines.length - 1;
				char = lines[lines.length - 1]!.length;
			}
		}

		return out;
	}
}

export namespace Lexer {
	export type ErrorHandler = (this: Lexer, string: string)=> Token;
	
	export interface Token {
		type: string;
		value: string;
	}

	export interface Config {
		regex: RegExp;
		types: any[];
		errorHandler: ErrorHandler;
	}

	export interface TokenMapItem {
		line: number;
		char: number;
	}
}