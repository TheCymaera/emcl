export class Lexer {
	config: Lexer.Config;

	index = 0;
	state: any;

	constructor(config: Lexer.Config) {
		this.config = config;
		this.reset();
	}

	reset() {
		this.state = this.config.startState;
		this.index = 0;
		return this;
	}

	currentRules() {
		return this.config.states.get(this.state)!;
	}

	step(string: string): Lexer.Token {
		const rules = this.currentRules();
		rules.regex.lastIndex = this.index;

		const match = rules.regex.exec(string);
		if (!match) return this.config.errorHandler.call(this, string);

		for (let i = 1; i < match.length; i++) {
			if (match[i] !== undefined) {
				return this._transition(match[i]!, rules.transitions[i-1]!);
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

	private _transition(match: string, transition: Lexer.TransitionFunction): Lexer.Token {
		const type = transition.call(this,match);
		this.index += match.length;
		return { value: match, type: type };
	}
}

export namespace Lexer {
	export type ErrorHandler = (this: Lexer, string: string)=> Token;
	
	export interface Token {
		type: string;
		value: string;
	}
	
	export interface State {
		regex: RegExp;
		transitions: TransitionFunction[];
	}

	export type TransitionFunction = (this: Lexer, match: string)=>string;

	export interface Config {
		startState: any;
		states: Map<any, State>;
		errorHandler: ErrorHandler;
	}

	export interface TokenMapItem {
		line: number;
		char: number;
	}
}