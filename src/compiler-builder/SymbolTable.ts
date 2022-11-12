export class SymbolTable<K,V> {
	has(identifier: K): boolean {
		for (let i = this._symbols.length - 1; i >= 0; i--) {
			const scope = this._symbols[i]!;
			if (scope.has(identifier)) return true;
		}
		return false;
	}

	hasInScope(identifier: K) {
		const map = this._symbols[this._symbols.length - 1]!;
		return map.has(identifier);
	}

	get(identifier: K): V|undefined {
		for (let i = this._symbols.length - 1; i >= 0; i--) {
			const scope = this._symbols[i]!;
			if (scope.has(identifier)) return scope.get(identifier)!;
		}
		return undefined;
	}

	set(identifier: K, value: V) {
		const map = this._symbols[this._symbols.length - 1]!;
		map.set(identifier, value);
	}

	enterScope() {
		this._symbols.push(new Map);
	}

	exitScope() {
		if (this.isGlobal()) throw new Error(`Cannot exit the global scope.`);
		this._symbols.pop();
	}

	isGlobal() {
		return this._symbols.length === 1;
	}

	private readonly _symbols: Map<K, V>[] = [new Map];
}