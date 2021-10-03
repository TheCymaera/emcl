import { Arithmetic } from "../../ast/instructions.js";
import { NumberConstant } from "../../ast/storage.js";

export function substituteArithmetic(arithmetic: Arithmetic) {
	// compute expressions if both sides are constants
	if (arithmetic.lhs instanceof NumberConstant && arithmetic.rhs instanceof NumberConstant) {
		switch (arithmetic.op) {
			case "+": return new NumberConstant(arithmetic.lhs.value + arithmetic.rhs.value);
			case "-": return new NumberConstant(arithmetic.lhs.value - arithmetic.rhs.value);
			case "*": return new NumberConstant(arithmetic.lhs.value * arithmetic.rhs.value);
			case "/": return new NumberConstant(arithmetic.lhs.value / arithmetic.rhs.value);
			case "%": return new NumberConstant(arithmetic.lhs.value % arithmetic.rhs.value);
		}
	}

	// prefer expressions with constants on the RHS
	if (arithmetic.lhs instanceof NumberConstant && !(arithmetic.rhs instanceof NumberConstant)) {
		switch (arithmetic.op) {
			// C + x = x + C
			case "+": return new Arithmetic(arithmetic.rhs, "+", arithmetic.lhs);
			
			// C - x = x + -C
			case "-": return new Arithmetic(arithmetic.rhs, "+", new NumberConstant(-arithmetic.lhs.value));
			
			// C * x = x * C
			case "*": return new Arithmetic(arithmetic.rhs, "*", arithmetic.lhs);
			
			// C / x = x * 1/C
			case "-": return new Arithmetic(arithmetic.rhs, "*", new NumberConstant(1/arithmetic.lhs.value));
		}
	}

	if (arithmetic.op === "+") {
		// x + 0 = x
		if (NumberConstant.is(arithmetic.rhs, 0)) return arithmetic.lhs;
	}
	
	if (arithmetic.op === "*") {
		// x * 1 = x
		if (NumberConstant.is(arithmetic.rhs, 1)) return arithmetic.lhs;
		
		// x * 0 = 0
		if (NumberConstant.is(arithmetic.rhs, 0)) return new NumberConstant(0);

		// x * 2 = x + x
		if (NumberConstant.is(arithmetic.rhs, 2)) return new Arithmetic(arithmetic.lhs, "+", arithmetic.lhs);
	}
	
	if (arithmetic.op === "-") {
		// x - 0 = x
		if (NumberConstant.is(arithmetic.rhs, 0)) return arithmetic.lhs;
		
		// x - x = 0
		if (arithmetic.lhs.sameAs(arithmetic.rhs)) return new NumberConstant(0);
	}
	
	if (arithmetic.op === "/") {
		// x / 0 = ?
		if (NumberConstant.is(arithmetic.rhs, 0)) return new NumberConstant(0);

		// x / 1 = x
		if (NumberConstant.is(arithmetic.rhs, 1)) return arithmetic.lhs;
		
		// x / x = 1
		if (arithmetic.lhs.sameAs(arithmetic.rhs)) return new NumberConstant(1);
	}
	
	if (arithmetic.op === "%") {
		// x % x = 0
		if (arithmetic.lhs.sameAs(arithmetic.rhs)) return new NumberConstant(0);

		// x % 1 = 0
		if (NumberConstant.is(arithmetic.rhs, 1)) return new NumberConstant(0);
	}

	return undefined;
}