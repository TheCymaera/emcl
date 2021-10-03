import { Lexer } from "./Lexer.js";

export class LexerBuilder {
	startState: string;
	states: Map<string, Rule[]> = new Map;
	errorHandler: Lexer.ErrorHandler = function(string) {
		return {
			type: "ILLEGAL",
			value: string[this.index++]!,
		}
	}

	constructor(startState: any = "start") {
		this.startState = startState;
	}

	define(type: string|Lexer.TransitionFunction, patterns: (string|RegExp)|(string|RegExp)[], states: any|any[] = this.startState) {
		states = Array.isArray(states) ? states : [states];
		patterns = Array.isArray(patterns) ? patterns : [patterns];
		
		const rules: Rule[] = [];
		for (const pattern of patterns) {
			const patternString = typeof pattern === "string" ? pattern : pattern.source;
			rules.push([patternString, typeof type === "string" ? ()=>type : type]);
		}

		for (const stateName of states) {
			const state = this.states.get(stateName);
			if (state) {
				state.push(...rules);
			} else {
				this.states.set(stateName, [...rules]);
			}
		}
	}

	defineString(type: string|Lexer.TransitionFunction, strings: string|string[], states?: any|any[]) {
		const patterns = (Array.isArray(strings) ? strings : [strings]).map(i=>LexerBuilder.stringRegex(i));
		return this.define(type, patterns, states);
	}

	buildConfig(): Lexer.Config {
		const config: Lexer.Config = {
			startState: this.startState, 
			states: new Map, 
			errorHandler: this.errorHandler,
		};

		for (const [state, rules] of this.states) {
			config.states.set(state, LexerBuilder.buildState(rules));
		}
		return config;
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

	static buildState(rules: Rule[]): Lexer.State {
		const patterns: string[] = [];
		const transitions: Lexer.TransitionFunction[] = [];
		for (const [pattern, transition] of rules) {
			patterns.push(pattern);
			transitions.push(transition);
		}

		const regex = new RegExp(LexerBuilder.unionRegex(patterns), "gy");
		return { regex, transitions };
	}

	static StaticTransition(type: string, newState: any) {
		return function(this: Lexer) {
			this.state = newState;
			return type;
		}
	}
}

export type Rule = [string, Lexer.TransitionFunction];