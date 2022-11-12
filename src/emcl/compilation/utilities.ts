import { Value } from "../ast/astNode.js";

export class FunctionParameterMap {
	readonly unused: Map<string|number, Value> = new Map;
	constructor(parameters: Iterable<[string|number, Value]>) {
		this.unused = new Map(parameters);
	}

	use(name: string|number) {
		const out = this.unused.get(name);
		this.unused.delete(name);
		return out;
	}
}