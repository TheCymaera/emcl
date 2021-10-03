import * as mil from "../../../mil/mil.js";
import { Address } from "../astNode.js";

export class Score extends Address {
	constructor(
		public address: mil.ScoreAccess|mil.NumberVariable,
	) { super(); }
}

export class NBT extends Address {
	constructor(
		public address: mil.NBTAccess,
	) { super(); }
}