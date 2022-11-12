import { Value } from "../astNode.js";
import * as mil from "mil";

export class AnyValue extends Value {
	constructor(
		public address: mil.NBTPointer,
	) { super(); }

	isConst(): boolean {
		return false;
	}

	displayName() {
		return "any";
	}
}