import * as mil from "mil";
import { Changes } from "./Changes.js";

export function applyJoinInstructions(program: mil.Program): Changes {
	const changes = new Changes("Join instructions");
	for (const [name, instructions] of program.branches) {
		for (let i = 0; i < instructions.length; i++) {
			const first = instructions[i];
			const second = instructions[i+1];
	
			if (first instanceof mil.Assignment && second instanceof mil.Assignment) {
				const replacement = joinAssignment(first, second);
				if (!replacement) continue;
		
				instructions.splice(i, 2, replacement);
				changes.addReplaced("Joined instructions", [first, second], [replacement]);
				break;
			}
		}
	}
	return changes;
}

function joinAssignment(first: mil.Assignment, second: mil.Assignment): mil.Instruction|undefined {
	// dst = x * 3
	// dst *= 3

	// both instructions must have the same lhs
	if (!(first.lhs.sameTargetAs(second.lhs))) return;

	// dst = 1 
	// dst = 2
	// in this situation, only keep the second instruction
	if (!mil.Value.contains(second.rhs, first.lhs)) return second;

	// both instructions must be arithmetic
	if (!(first.rhs instanceof mil.Arithmetic)) return;
	if (!(second.rhs instanceof mil.Arithmetic)) return;
	
	// second instruction must be two-address assignment
	if (!(second.lhs.sameTargetAs(second.rhs.lhs))) return;

	// both must end with a constant
	if (!(first.rhs.rhs instanceof mil.NumberConstant)) return;
	if (!(second.rhs.rhs instanceof mil.NumberConstant)) return;

	if (canCombine(first.rhs.op, second.rhs.op)) {
		return new mil.Assignment(
			first.lhs, 
			new mil.Arithmetic(
				first.rhs.lhs, 
				first.rhs.op, 
				calc(first.rhs.rhs, second.rhs.op, second.rhs.rhs), 
			)
		);
	}

	return undefined;
}

function canCombine(op1: mil.Arithmetic["op"], op2: mil.Arithmetic["op"]): boolean {
	if (op1 === "+" || op1 === "-") {
		if (op2 === "+" || op2 === "-") {
			return true;
		}
	}

	if (op1 === "*" || op1 === "/") {
		if (op2 === "*" || op2 === "/") {
			return true;
		}
	}

	return false;
}


function calc(lhs: mil.NumberConstant, op: mil.Arithmetic["op"], rhs: mil.NumberConstant) {
	switch(op) {
		case "+": return new mil.NumberConstant(lhs.value + rhs.value, mil.DataType.Double);
		case "-": return new mil.NumberConstant(lhs.value - rhs.value, mil.DataType.Double);
		case "*": return new mil.NumberConstant(lhs.value * rhs.value, mil.DataType.Double);
		case "/": return new mil.NumberConstant(lhs.value / rhs.value, mil.DataType.Double);
		case "%": return new mil.NumberConstant(lhs.value % rhs.value, mil.DataType.Double);
	}
}