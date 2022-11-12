import * as mil from "mil";

/**
 * Replaces a compare expression with a more performant one.
 * Returns undefined if it can't be replaced.
 */
export function substituteCompare(compare: mil.Compare) {
	// compute expressions if both sides are constants
	if (compare.lhs instanceof mil.NumberConstant && compare.rhs instanceof mil.NumberConstant) {
		let result: number;
		switch(compare.op) {
			case "<"	: result = +(compare.lhs.value < compare.rhs.value);
			case "<="	: result = +(compare.lhs.value <= compare.rhs.value);
			case "=="	: result = +(compare.lhs.value === compare.rhs.value);
			case ">="	: result = +(compare.lhs.value >= compare.rhs.value);
			case ">"	: result = +(compare.lhs.value > compare.rhs.value);
			case "!="	: result = +(compare.lhs.value != compare.rhs.value);
		}
		return new mil.NumberConstant(result, mil.DataType.Double);
	}

	// prefer constants on the rhs
	if (compare.lhs instanceof mil.NumberConstant && !(compare.rhs instanceof mil.NumberConstant)) {
		return compare.flip();
	}

	// x == x is always true
	// x != x is always false
	if (compare.lhs.sameAs(compare.rhs)) {
		return new mil.NumberConstant(+(["<=","==",">="].includes(compare.op)), mil.DataType.Double);
	}

	// x != 0 can be replaced with x
	if (compare.op === "!=" && mil.NumberConstant.equals(compare.rhs, 0)) {
		return compare.lhs;
	}

	return undefined;
}