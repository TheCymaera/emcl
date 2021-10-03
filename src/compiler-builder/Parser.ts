/**
 * A programmable parser for deterministic context-free languages.
 */
export class Parser<Leaf,Branch> {
	config: Parser.Config<Leaf, Branch>;
	stateStack: number[] = [];

	constructor(config: Parser.Config<Leaf, Branch>) {
		this.config = config;
	}

	state(): number { 
		return this.stateStack[this.stateStack.length - 1] || 0; 
	}

	reset(): void {
		this.stateStack.length = 0;
	}

	/**
	 * Calls 'step' until shift or accept, thus consuming the lookahead.
	 * If the lookahead is rejected, the original parser state is restored.
	 */
	next(lookahead: Leaf, out: Readonly<Parser.Action>[] = []): Readonly<Parser.Action>[] | undefined {
		const outBackupLength = out.length;
		const stackBackup = [...this.stateStack];
		while (true) {
			const action = this.step(lookahead);
			
			// rejected
			if (!action) {
				this.stateStack = stackBackup;
				out.length = outBackupLength;
				return undefined;
			}

			// add action to output
			out.push(action);

			if (action.type === Parser.ActionType.ACCEPT || 
				action.type === Parser.ActionType.SHIFT) {
				return out;
			}
		}
	}

	/**
	 * Call after end of input.
	 */
	endOfInput(out: Readonly<Parser.Action>[] = []): Readonly<Parser.Action>[] | undefined {
		return this.next(this.config.endOfInput, out);
	}

	/**
	 * Returns the next action.
	 */
	step(lookahead: Leaf): Readonly<Parser.Action> | undefined {
		const stateActions = this.config.actionTable[this.state()];
		const action = stateActions?.get(lookahead);
		
		// reject lookahead if there are no actions
		if (!action) return undefined;

		switch (action.type) {
			case Parser.ActionType.ACCEPT: return action;

			case Parser.ActionType.SHIFT: {
				// 1. shift to new state 'n'
				// 2. consume lookahead
				this.stateStack.push(action.n);
				return action;
			}
			case Parser.ActionType.REDUCE: {
				// 1. reduce the top of the stack using the n-th rule	
				const {lhs,rhs:{length:rhsLength}} = this.config.rules[action.n]!;
				this.stateStack.splice(-rhsLength,rhsLength);
				
				// 2. get goto-instruction using the new state and reduction symbol
				const goto = this.config.gotoTable[this.state()]!.get(lhs);
				// goto new state
				if (goto === undefined) return undefined;
				
				this.stateStack.push(goto);
				return action;
			}
		}
	}
}


export namespace Parser {
	export interface Config<Leaf,Branch> {
		actionTable: ActionTable<Leaf>;
		gotoTable: GotoTable<Branch>;
		rules: Rule<Leaf,Branch>[];
		endOfInput: Leaf;
	}


	export interface Rule<Leaf,Branch> {
		lhs: Branch, 
		rhs: (Leaf|Branch)[]
	}

	export const enum ActionType { SHIFT, REDUCE, ACCEPT };

	/**
	 * A parser action
	 * 1. Shift(n)	- where 'n' is the new state
	 * 2. Reduce(n)	- where 'n' is the reduction rule.
	 * 3. Accept(n) - where 'n' is the accepted rule.
	 */
	export interface Action {
		type: ActionType, 
		n: number
	}

	/**
	 * An action table indicates when to shift, reduce or accept a potential lookahead.
	 * - the start state is 0.
	 * @example
	 * actionTable[state].get(lookahead) = Action;
	 */
	export type ActionTable<Leaf> = Map<Leaf, Action>[];

	/**
	 * A goto table indicates what the next state of the parser will be after a reduction.
	 * - the start state is 0
	 * @example
	 * gotoTable[state].get(lookahead) = newState;
	 */
	export type GotoTable<Branch> = Map<Branch, number>[];
}