import { NBTAccess, ScaledNBTAccess, ScoreAccess, NumberVariable } from "../../ast/storage.js";

export class SymbolTable<K extends SymbolTable.Storage, T> {
	set(storage: K, value: T) {
		this.remove(storage);
		this._values.set(storage, value);
	}

	has(storage: K) {
		for (const [key, value] of this._values) if (storage.sameAs(key)) return true;
		return false;
	}

	get(storage: K) {
		for (const [key, value] of this._values) if (storage.sameAs(key)) return value;
		return undefined;
	}

	remove(storage: K) {
		this.filter((key)=>!storage.sameAs(key));
	}

	filter(callback: (storage: K, key: T)=>boolean) {
		for (const [storage, key] of this._values) {
			const keep = callback(storage, key);
			if (!keep) this._values.delete(storage);
		}
	}

	clear() {
		this._values.clear();
	}

	debug_table() {
		const out = {};
		for (const [key, value] of this._values) {
			out[key.serialize()] = ("serialize" in value) ? (value as any).serialize() : `${value}`;
		}
		return out;
	}

	get size() {
		return this._values.size;
	}

	private readonly _values: Map<K, T> = new Map;
}

export namespace SymbolTable {
	export type Storage = ScoreAccess|NumberVariable|NBTAccess|ScaledNBTAccess;
}