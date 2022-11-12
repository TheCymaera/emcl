import * as mil from "mil";

export interface ReadonlyStoreMap<T> {
	get(lhs: mil.Store): T|undefined;
	entries(): IterableIterator<[mil.Store, T]>;
}

export class StoreMap<T> implements ReadonlyStoreMap<T> {
	get(store: mil.Store) {
		for (const [other, value] of this._values) {
			if (other.sameTargetAs(store)) return value;
		}
		return;
	}

	entries() {
		return this._values.entries();
	}

	set(store: mil.Store, value: T) {
		this.remove(store);
		this._values.set(store, value);
	}

	remove(store: mil.Store) {
		for (const other of this._values.keys()) {
			if (other.sameTargetAs(store)) {
				this._values.delete(other);
				return;
			}
		}
	}

	clear() {
		this._values.clear();
	}

	filter(filter: (key: mil.Store, value: T) => boolean) {
		for (const [key, value] of this._values) {
			const keep = filter(key, value);
			if (!keep) this._values.delete(key);
		}
	}

	private readonly _values: Map<mil.Store, T> = new Map;
}