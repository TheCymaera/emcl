import * as mil from "mil";

export function substituteArithmetic(arithmetic: mil.Arithmetic) {
	// compute expressions if both sides are constants
	if (arithmetic.lhs instanceof mil.NumberConstant && arithmetic.rhs instanceof mil.NumberConstant) {
		let result: number;
		switch (arithmetic.op) {
			case "+": result = arithmetic.lhs.value + arithmetic.rhs.value; break;
			case "-": result = arithmetic.lhs.value - arithmetic.rhs.value; break;
			case "*": result = arithmetic.lhs.value * arithmetic.rhs.value; break;
			case "/": result = arithmetic.lhs.value / arithmetic.rhs.value; break;
			case "%": result = arithmetic.lhs.value % arithmetic.rhs.value; break;
		}
		return new mil.NumberConstant(result, mil.DataType.Double);
	}

	// prefer expressions with constants on the RHS
	if (arithmetic.lhs instanceof mil.NumberConstant && !(arithmetic.rhs instanceof mil.NumberConstant)) {
		switch (arithmetic.op) {
			// C + x = x + C
			case "+": return new mil.Arithmetic(arithmetic.rhs, "+", arithmetic.lhs);
			
			// C - x = x + -C
			case "-": return new mil.Arithmetic(arithmetic.rhs, "+", new mil.NumberConstant(-arithmetic.lhs.value, arithmetic.lhs.dataType));
			
			// C * x = x * C
			case "*": return new mil.Arithmetic(arithmetic.rhs, "*", arithmetic.lhs);
			
			// C / x = x * 1/C
			case "-": return new mil.Arithmetic(arithmetic.rhs, "*", new mil.NumberConstant(1/arithmetic.lhs.value, arithmetic.lhs.dataType));
		}
	}

	if (arithmetic.op === "+") {
		// x + 0 = x
		if (mil.NumberConstant.equals(arithmetic.rhs, 0)) return arithmetic.lhs;
	}
	
	if (arithmetic.op === "*") {
		// x * 1 = x
		if (mil.NumberConstant.equals(arithmetic.rhs, 1)) return arithmetic.lhs;
		
		// x * 0 = 0
		if (mil.NumberConstant.equals(arithmetic.rhs, 0)) return new mil.NumberConstant(0, mil.DataType.Int);

		// x * 2 = x + x
		if (mil.NumberConstant.equals(arithmetic.rhs, 2)) return new mil.Arithmetic(arithmetic.lhs, "+", arithmetic.lhs);
	}
	
	if (arithmetic.op === "-") {
		// x - 0 = x
		if (mil.NumberConstant.equals(arithmetic.rhs, 0)) return arithmetic.lhs;
		
		// x - x = 0
		if (arithmetic.lhs.sameAs(arithmetic.rhs)) return new mil.NumberConstant(0, mil.DataType.Int);
	}
	
	if (arithmetic.op === "/") {
		// x / 0 = ?
		if (mil.NumberConstant.equals(arithmetic.rhs, 0)) return new mil.NumberConstant(0, mil.DataType.Int);

		// x / 1 = x
		if (mil.NumberConstant.equals(arithmetic.rhs, 1)) return arithmetic.lhs;
		
		// x / x = 1
		if (arithmetic.lhs.sameAs(arithmetic.rhs)) return new mil.NumberConstant(1, mil.DataType.Int);
	}
	
	if (arithmetic.op === "%") {
		// x % x = 0
		if (arithmetic.lhs.sameAs(arithmetic.rhs)) return new mil.NumberConstant(0, mil.DataType.Int);

		// x % 1 = 0
		//if (mil.NumberConstant.equals(arithmetic.rhs, 1)) return new mil.NumberConstant(0, mil.DataType.Int);
	}

	return undefined;
}