import { Arithmetic, Instruction, Copy, Goto, GotoSubcommand, MCCommand } from "../../ast/instructions.js";
import { NumberConstant, ScoreAccess, NumberVariable, ScaledNBTAccess } from "../../ast/storage.js";
import { Compare } from "../../ast/subcommands.js";
import { Program } from "../../mil.js";
import { countReferences } from "../utilities/countReferences.js";
import { SymbolTable } from "../utilities/SymbolTable.js";


export function valuePropagation(program: Program) {
	let changed = false;
	const referenceCount = countReferences(program);
	for (const [name, block] of program.blocks) {
		const valueTable: ValueTable = new SymbolTable;

		const newBlock: Instruction[] = [];
		program.blocks.set(name, newBlock);
		
		for (const instruction of block) {
			const newInstruction = valuePropagationInstruction(instruction, valueTable, referenceCount);
			newBlock.push(newInstruction);
			if (instruction !== newInstruction) changed = true;
		}
	}
	return changed;
}


type Key = ScoreAccess | NumberVariable;
type Value = Key | NumberConstant | Compare | Arithmetic;
type ValueTable = SymbolTable<Key, Value>;

function valuePropagationInstruction(instruction: Instruction, valueTable: ValueTable, referenceCount: SymbolTable<NumberVariable, number>): Instruction {
	const newInstruction = replace(instruction, valueTable, referenceCount);
	update(instruction, valueTable);
	return newInstruction || instruction;
}

function update(command: Instruction, valueTable: ValueTable) {
	if (command instanceof Copy) {
		if (command.dst instanceof ScoreAccess && command.dst.isLocallyStatic() ||
			command.dst instanceof NumberVariable) {

			valueTable.filter((key, value)=>{
				if (key.sameAs(command.dst)) return false;
				if (contains(value, command.dst)) return false;
				return true;
			});

			
			if (command.src instanceof ScoreAccess && command.src.isLocallyStatic() ||
				command.src instanceof NumberVariable ||
				command.src instanceof Compare ||
				command.src instanceof Arithmetic ||
				command.src instanceof NumberConstant) {
				
				if (!contains(command.src, command.dst)) valueTable.set(command.dst, command.src);
			}
		}
		return;
	}

	if (command instanceof MCCommand && command.isComment()) {
		return;
	}

	valueTable.clear();
}

function replace(node: Value|Instruction|ScaledNBTAccess|GotoSubcommand, valueTable: ValueTable, referenceCount: SymbolTable<NumberVariable, number>) {
	if (node instanceof ScoreAccess) return valueTable.get(node);
	if (node instanceof NumberVariable) return valueTable.get(node);

	if (node instanceof Copy) {
		if (node.src instanceof ScoreAccess || node.src instanceof NumberVariable) {
			// only propagate expressions unless they are only referenced once.
			const sourceIsSoleReference = referenceCount.get(node.src as NumberVariable) === 1;
			
			const newSource = sourceIsSoleReference ? 
				valueTable.get(node.src as Key) : 
				getNonExpression(valueTable, node.src as Key);
			
			if (newSource) return new Copy(node.dst, newSource);
		} else {
			const newSource = replace(node.src, valueTable, referenceCount);
			if (newSource) return new Copy(node.dst, newSource);
		}
	}

	if (node instanceof Compare) {
		const newLHS = getNonExpression(valueTable, node.lhs as Key);
		const newRHS = getNonExpression(valueTable, node.rhs as Key);

		if (newLHS || newRHS) return new Compare(newLHS || node.lhs, node.op, newRHS || node.rhs);
	}

	if (node instanceof Arithmetic) {
		const newLHS = getNonExpression(valueTable, node.lhs as Key);
		const newRHS = getNonExpression(valueTable, node.rhs as Key);

		if (newLHS || newRHS) return new Arithmetic(newLHS || node.lhs, node.op, newRHS || node.rhs);
	}

	if (node instanceof Goto) {
		const newConditions: GotoSubcommand[] = [];
		let changed = false;
		for (const subcommand of node.subcommands) {
			const newSubcommand = replace(subcommand, valueTable, referenceCount);

			if (newSubcommand instanceof ScoreAccess || newSubcommand instanceof NumberVariable || newSubcommand instanceof Compare || newSubcommand instanceof NumberConstant) {
				newConditions.push(newSubcommand);
				changed = true;
			} else {
				newConditions.push(subcommand);
			}
		}

		if (changed) return new Goto(newConditions, node.block);
	}

	return undefined;
}

function getNonExpression(valueTable: ValueTable, key: Key) {
	const out = valueTable.get(key);
	if (out instanceof Compare) return undefined;
	if (out instanceof Arithmetic) return undefined;
	return out;
}

function contains(value: Value, src: unknown): boolean {
	if (value instanceof NumberConstant) return false;
	if (src instanceof NumberConstant) return false;

	if (value instanceof Compare || value instanceof Arithmetic) {
		return contains(value.lhs, src) || contains(value.rhs, src);
	}

	return value.sameAs(src);
}
