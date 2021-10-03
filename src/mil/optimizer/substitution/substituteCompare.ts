import { Compare } from "../../ast/subcommands.js";
import { NumberConstant } from "../../ast/storage.js";

export function substituteCompare(compare: Compare) {
	// compute expressions if both sides are constants
	if (compare.lhs instanceof NumberConstant && compare.rhs instanceof NumberConstant) {
		switch(compare.op) {
			case "<"	: return new NumberConstant(+(compare.lhs.value < compare.rhs.value));
			case "<="	: return new NumberConstant(+(compare.lhs.value <= compare.rhs.value));
			case "=="	: return new NumberConstant(+(compare.lhs.value === compare.rhs.value));
			case ">="	: return new NumberConstant(+(compare.lhs.value >= compare.rhs.value));
			case ">"	: return new NumberConstant(+(compare.lhs.value > compare.rhs.value));
			case "!="	: return new NumberConstant(+(compare.lhs.value != compare.rhs.value));
		}
	}

	// prefer constants on the rhs
	if (compare.lhs instanceof NumberConstant && !(compare.rhs instanceof NumberConstant)) {
		return compare.flip();
	}

	// x == x is always true
	// x != x is always false
	if (compare.lhs.sameAs(compare.rhs)) {
		return new NumberConstant(+(["<=","==",">="].includes(compare.op)));
	}

	return undefined;
}