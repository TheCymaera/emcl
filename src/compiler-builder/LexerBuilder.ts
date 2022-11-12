import { Lexer } from "./Lexer.js";

export class LexerBuilder {
	startState: string;
	rules: [string, string][] = [];
	errorHandler: Lexer.ErrorHandler = function(string) {
		return {
			type: "ILLEGAL",
			value: string[this.index++]!,
		}
	}

	constructor(startState: any = "start") {
		this.startState = startState;
	}

	define(type: string, patterns: (string|RegExp)|(string|RegExp)[]) {
		patterns = Array.isArray(patterns) ? patterns : [patterns];
		
		for (const pattern of patterns) {
			const patternString = typeof pattern === "string" ? pattern : pattern.source;
			this.rules.push([type, patternString]);
		}
	}

	defineString(type: string, strings: string|string[]) {
		strings = (Array.isArray(strings) ? strings : [strings]);
		const patterns = strings.map(i=>LexerBuilder.stringRegex(i));
		return this.define(type, patterns);
	}

	defineKeyword(type: string, strings: string|string[]) {
		strings = (Array.isArray(strings) ? strings : [strings]);
		const patterns = (Array.isArray(strings) ? strings : [strings]).map(i=>"\\b" + LexerBuilder.stringRegex(i) + "\\b");
		return this.define(type, patterns);
	}

	buildConfig(): Lexer.Config {
		const types: string[] = [];
		const patterns: string[] = [];

		for (const [type, pattern] of this.rules) {
			types.push(type);
			patterns.push(pattern);
		}

		return {
			types: types,
			regex: new RegExp(LexerBuilder.unionRegex(patterns), "gy"),
			errorHandler: this.errorHandler,
		}
	}

	build() {
		return new Lexer(this.buildConfig());
	}

	static stringRegex(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}

	static unionRegex(patterns: Iterable<string>): string {
		return "(" + [...patterns].join(")|(") + ")";
	}
}
