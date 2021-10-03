import { Instruction, Copy, Arithmetic, ArithmeticOperator, Goto } from "../../ast/instructions.js";
import { Program } from "../../ast/Program.js";
import { NumberConstant } from "../../ast/storage.js";

export function joinInstructionsProgram(program: Program): boolean {
	let changed = false;
	for (const [name, instructions] of program.blocks) {
		changed = joinInstructionsArray(instructions) || changed;
	}
	return changed;
}


function joinInstructionsArray(instructions: Instruction[]) {
	let changed = false;
	for (let i = 0; i < instructions.length; i++) {
		const first = instructions[i];
		const second = instructions[i+1];

		if (!(first && second)) return changed;

		const newInstruction = joinInstructions(first, second);
		if (!newInstruction) continue;

		instructions.splice(i, 2, newInstruction);
	}

	return changed;
}


function joinInstructions(first: Instruction, second: Instruction): undefined|Instruction {
	// dst = x * 3
	// dst *= 3
	if (first instanceof Copy && second instanceof Copy) {
		
		// both instructions must be assign to the same destination
		if (!(first.dst.sameAs(second.dst))) return;
		
		// both instructions must be arithmetic
		if (!(first.src instanceof Arithmetic)) return;
		if (!(second.src instanceof Arithmetic)) return;
		
		// second instruction must be two-address assignment
		if (!(second.dst.sameAs(second.src.lhs))) return;

		// both must end with a constant
		if (!(first.src.rhs instanceof NumberConstant)) return;
		if (!(second.src.rhs instanceof NumberConstant)) return;
		

		if (canCombine(first.src.op, second.src.op)) {
			return new Copy(
				first.dst, 
				new Arithmetic(
					first.src.lhs, 
					first.src.op, 
					calc(first.src.rhs, second.src.op, second.src.rhs)
				)
			);
		}
	}

	return undefined;
}

function canCombine(op1: ArithmeticOperator, op2: ArithmeticOperator): boolean {
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


function calc(lhs: NumberConstant, op: ArithmeticOperator, rhs: NumberConstant) {
	switch(op) {
		case "+": return new NumberConstant(lhs.value + rhs.value);
		case "-": return new NumberConstant(lhs.value - rhs.value);
		case "*": return new NumberConstant(lhs.value * rhs.value);
		case "/": return new NumberConstant(lhs.value / rhs.value);
		case "%": return new NumberConstant(lhs.value % rhs.value);
	}
}