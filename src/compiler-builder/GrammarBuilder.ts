import { Parser } from "./Parser.js";
import { TreeBuilder } from "./TreeBuilder.js";

export class GrammarBuilder<Leaf = string, Branch = string, Token = any> {
	define<T extends (Token|any)[]>(lhs: Branch, rhs: (Leaf|Branch)[], nodeConstructor?: ((children: T)=>any)): void {
		this._rules.push({lhs,rhs});
		this._nonTerminals.add(lhs);
		this._nodes.add(lhs);
		for (const node of rhs) this._nodes.add(node);
		this._nodeConstructors.push(
			(nodeConstructor as TreeBuilder.NodeConstructor<Token,any>) || 
			(rhs.length === 1 ? GrammarBuilder.REDUCE_FIRST : GrammarBuilder.REDUCE_ARRAY)
		);
	}

	/**
	 * Define the expression: a => b{n}
	 */
	defineQuantity(lhs: Branch, target: Leaf|Branch, quantity: number): void {
		this.define(lhs,(new Array(quantity)).fill(target));
	}
	
	/**
	 * Define the expression: a => b*
	 */
	defineZeroOrMore(lhs: Branch, target: Leaf|Branch) {
		this.defineMinQuantity(lhs,target,0);
	}

	/**
	 * Define the expression: a => b+
	 */
	defineOneOrMore(lhs: Branch, target: Leaf|Branch) {
		this.defineMinQuantity(lhs,target,1);
	}

	/**
	 * Define the expression: a => b{min,}
	 */
	defineMinQuantity(lhs: Branch, target: Leaf|Branch, min: number): void {
		this.defineQuantity(lhs,target,min);
		this.define(lhs,[lhs,target],([items,newItem])=>{
			items.push(newItem);
			return items;
		});
	}

	/**
	 * Define the expression a => b (d b)*
	 */
	defineDelimitedList(lhs: Branch, target: Leaf|Branch, delimiter: Leaf|Branch, allowEmpty: boolean) {
		if (allowEmpty) this.define(lhs,[], ()=>[]);
		this.define(lhs,[target], ([value])=>[value]);
		this.define(lhs,[lhs,delimiter,target],([items,,newItem])=>{
			items.push(newItem);
			return items;
		});
	}

	/**
	 * Define the expression a => b d|(d b)*
	 */
	defineTrailingDelimitedList(lhs: Branch, nonDelimitedLHS: Branch, target: Leaf|Branch, delimiter: Leaf|Branch, allowEmpty: boolean) {
		this.defineDelimitedList(nonDelimitedLHS, target, delimiter, allowEmpty);
		this.define(lhs, [nonDelimitedLHS, delimiter], GrammarBuilder.REDUCE_FIRST);
		this.define(lhs, [nonDelimitedLHS], GrammarBuilder.REDUCE_FIRST);
	}
	

	buildParserConfig(startSymbol: Branch, endOfInput: Leaf): Parser.Config<Leaf,Branch> {
		const actionTable: Parser.ActionTable<Leaf> = [];
		const gotoTable: Parser.GotoTable<Branch> = [];
		
		// each state is represented by an item-set.
		const states: Set<Item>[] = [ this._startItemSet(startSymbol) ];

		// the array will be extended as we discover new states
		for (let state = 0; state < states.length; state++) {
			const itemSet = states[state]!;

			// find all transitions for this state.
			// consider the next item-set for each potential lookahead.
			const transitions: Map<Leaf|Branch,number> = new Map;
			for (const [lookahead, nextItemSet] of this._nextItemSets(itemSet)) {
				// find the state that this item-set represents.
				// check 'states' to see if it has already been discovered.
				// if not, add it to the array as a new state.
				let newState = indexOfSet(states, nextItemSet);
				if (newState === -1) newState = states.push(nextItemSet) - 1;
				transitions.set(lookahead, newState);
			}


			// create table rows for this state
			actionTable[state] = new Map;
			gotoTable[state] = new Map;

			// for each item in the current state
			for (const item of itemSet) {
				const lookahead = this._itemLookahead(item);
				if (lookahead === undefined) {
					// if the item is completed, reduce using item.rule
					const rule = item_rule(item);
					const action = {type: Parser.ActionType.REDUCE, n: rule};

					
					actionTable[state]!.set(endOfInput, action);
					for (const lookahead of this._nodes) {
						if (this._nonTerminals.has(lookahead as Branch)) continue;
						actionTable[state]!.set(lookahead as Leaf, action);
					}

					// if the rule has the start symbol on the left-hand side,
					// then accept on 'endOfInput'.
					if (this._rules[rule]!.lhs === startSymbol) {
						actionTable[state]!.set(endOfInput, {type: Parser.ActionType.ACCEPT, n: rule});
					}
				} else {
					const nextState = transitions.get(lookahead)!;
					if (!this._nonTerminals.has(lookahead as Branch)) {
						// shift on terminal lookaheads
						actionTable[state]!.set(<Leaf>lookahead, {type: Parser.ActionType.SHIFT, n: nextState});
					} else {
						// goto on non-terminal lookaheads
						gotoTable[state]!.set(<Branch>lookahead, nextState);
					}
				}
			}
		}

		return {
			actionTable,
			gotoTable,
			rules: [...this._rules],
			endOfInput,
		}
	}

	buildTreeBuilderConfig(): TreeBuilder.Config<Token,any> {
		return {
			rules: [...this._rules],
			nodeConstructors: [...this._nodeConstructors],
		};
	}

	buildParser(startSymbol: Branch, endOfInput: Leaf): Parser<Leaf,Branch> {
		return new Parser(this.buildParserConfig(startSymbol, endOfInput));
	}

	buildTreeBuilder() {
		return new TreeBuilder(this.buildTreeBuilderConfig());
	}

	debug_itemString(item: Item) {
		const rule = this._rules[item_rule(item)]!;
		const pointer = item_pointer(item);
		return rule.lhs + " => " + rule.rhs.slice(0, pointer).join(" ") + "." + rule.rhs.slice(pointer).join(" ");
	}

	static readonly REDUCE_FIRST = (children: any[])=>children[0];
	static readonly REDUCE_ARRAY = (children: any[])=>children;
	static REDUCE_NTH(n: number) { 
		return (children: any[])=>children[n];
	}
	
	private readonly _rules: Parser.Rule<Leaf,Branch>[] = [];
	private readonly _nonTerminals: Set<Branch> = new Set;
	private readonly _nodes: Set<Leaf|Branch> = new Set;
	private readonly _nodeConstructors: TreeBuilder.NodeConstructor<Token,any>[] = [];
	
	/**
	 * Get the lookahead for an item
	 */
	private _itemLookahead(item : Item): Branch|Leaf {
		return this._rules[item_rule(item)]!.rhs[item_pointer(item)]!;
	}

	/**
	 * Complete the closure for an item set
	 */
	private _completeClosure(set : Set<Item>) : Set<Item> {
		for (const item of set) {
			const lookahead = this._itemLookahead(item);
			// ignore if item is completed
			if (lookahead === undefined) continue;
			// ignore if item is terminal
			if (!this._nonTerminals.has(lookahead as Branch)) continue;
			// add all reductions for the lookahead.
			// the reduction will be visited later in the loop and extended recursively
			for (let i = 0; i < this._rules.length; i++) {
				if (this._rules[i]!.lhs === lookahead) set.add(item_create(i,0));
			}
		}
		return set;
	}

	/**
	 * Get the start item-set for a start symbol
	 */
	private _startItemSet(startSymbol : Leaf|Branch) : Set<Item> {
		const out : Set<Item> = new Set;
		for (let i = 0 ; i < this._rules.length; i++) {
			if (this._rules[i]!.lhs === startSymbol) out.add(item_create(i,0));
		}
		return this._completeClosure(out);
	}

	/**
	 * For an item-set, find the next item-set for each potential lookahead.
	 */
	private _nextItemSets(oldSet : Set<Item>) : Map<Leaf|Branch,Set<Item>> {
		const out : Map<Leaf|Branch,Set<Item>> = new Map;

		// for each item in the old set
		for (const item of oldSet) {
			// create a new set for each potential
			// lookahead and add the next-item to the set.
			const lookahead = this._itemLookahead(item);
			if (!lookahead) continue;
			const set = out.get(lookahead) || new Set;
			if (!out.has(lookahead)) out.set(lookahead,set);
			set.add(item_next(item));
		}

		// complete the closure for each new set
		for (const set of out.values()) this._completeClosure(set)

		return out;
	}
}


type Item = string;

function item_create(rule: number, pointer: number = 0): Item {
	return `${rule}.${pointer}`;
}

function item_rule(item: string): number {
	return parseInt(item.slice(0,item.indexOf(".")));
}

function item_pointer(item: Item): number {
	return parseInt(item.slice(item.indexOf(".")+1));
}

function item_next(item: Item): Item {
	return item_create(item_rule(item),item_pointer(item)+1);
}

function setsAreEqual(set1: Set<Item>,set2: Set<Item>): boolean {
	if (set1.size !== set2.size) return false;
	for (const item of set1) if (!set2.has(item)) return false;
	return true;
}

function indexOfSet(setList: Set<Item>[],set: Set<Item>): number {
	for (let i = 0; i < setList.length; i++) {
		const compare = setList[i];
		if (setsAreEqual(compare!,set)) return i;
	}
	return -1;
}