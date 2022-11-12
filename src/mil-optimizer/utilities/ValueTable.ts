import * as mil from "mil";
import { StoreMap } from "./StoreMap.js";

export interface ReadonlyValueTable {
	get(store: mil.Store): mil.Value|undefined;
	displayText(): string;
}

export class ValueTable implements ReadonlyValueTable {
	private readonly _map = new StoreMap<mil.Value>();

	assign(store: mil.Store, value: mil.Value) {
		// stores that aren't locally static can't be cached.
		if (!store.isLocallyStatic()) return;

		// remove values that reference the store.
		this._map.filter((otherStore, otherValue)=>{
			if (mil.Value.contains(otherValue, store)) return false;
			return true;
		});

		// cache value
		this._map.set(store, value);
	}

	get(store: mil.Store) {
		return this._map.get(store);
	}

	clear() {
		this._map.clear();
	}

	displayText(): string {
		let out = "";
		for (const [store, value] of this._map.entries()) {
			const storeText = store.displayText();
			const valueText = value.displayText();
			out += storeText + " : " + valueText + "\n";
		}
		return out.slice(0, -1);
	}
}