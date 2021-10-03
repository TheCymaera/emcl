import { Parser  } from "./Parser.js";

export class TreeBuilder<Leaf, Branch> {
	config: TreeBuilder.Config<Leaf, Branch>;
	
	stack: (Leaf|Branch)[] = [];

	constructor(config: TreeBuilder.Config<Leaf, Branch>) {
		this.config = config;
	}

	reset(): this {
		this.stack.length = 0;
		return this;
	}

	step(action: Parser.Action, leaf: Leaf): boolean {
		if (action.type === Parser.ActionType.SHIFT) {
			this.stack.push(leaf);
			return true;
		} else {
			const {rhs: {length:rhsLength}} = this.config.rules[action.n]!;
			const replaced = this.stack.splice(-rhsLength,rhsLength);
			const replacement = this.config.nodeConstructors[action.n]!(replaced);
			this.stack.push(replacement);
			return false;
		}
	}

	buildTree(actions: Parser.Action[], leaves: Leaf[]): Branch {
		let i = 0;
		for (const action of actions) {
			if (this.step(action, leaves[i]!)) i++;
		}
		return <Branch>this.stack[0];
	}
}

export namespace TreeBuilder {
	export type NodeConstructor<Leaf, Branch> = ((children: (Leaf|Branch)[])=>Branch);

	export interface Config<Leaf,Branch> {
		rules : Parser.Rule<any,any>[];
		nodeConstructors: NodeConstructor<Leaf,Branch>[];
	}
	
}



