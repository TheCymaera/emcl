import { CodeGenerator } from "./Program.js";
import { ScoreAccess, ScaledNBTAccess, NumberConstant, NumberVariable } from "./storage.js";
import { Compare, MCSubcommand } from "./subcommands.js";

export interface Instruction {
	serialize(inline?: boolean): string;
	toCommand(generator: CodeGenerator): string[];
}

export class Copy implements Instruction {
	constructor(
		public dst: ScaledNBTAccess|ScoreAccess|NumberVariable,
		public src: ScaledNBTAccess|ScoreAccess|NumberVariable|NumberConstant|Compare|Arithmetic,
	) { }

	serialize(): string {
		if (this.src instanceof Arithmetic && this.dst.sameAs(this.src.lhs)) {
			return this.dst.serialize() + ` ${this.src.op}= ` + this.src.rhs.serialize();
		}
		return this.dst.serialize() + " = " + this.src.serialize();
	}

	toCommand(generator: CodeGenerator) {
		if (this.dst instanceof ScaledNBTAccess && this.src instanceof ScaledNBTAccess && this.dst.scale === this.src.scale) {
			// nbt = nbt
			return [`data modify ${this.dst.source.fragment()} set from ${this.src.source.fragment()}`]
		}

		if (this.dst instanceof ScoreAccess || this.dst instanceof NumberVariable) {
			// score = score
			const dst = generator.toScore(this.dst);
			if (this.src instanceof ScoreAccess || this.src instanceof NumberVariable) {
				const src = generator.toScore(this.src);
				return [`scoreboard players operation ${dst.fragment()} = ${src.fragment()}`];
			}

			// score = constant
			if (this.src instanceof NumberConstant) {
				return [`scoreboard players set ${dst.fragment()} ${this.src.value | 0}`];	
			}
		}

		if (this.src instanceof Arithmetic) {
			// score = arithmetic
			if (this.dst instanceof ScoreAccess || this.dst instanceof NumberVariable) {
				return this.src.writeTo(generator, this.dst);
			}

			// * = arithmetic
			const dst = generator.ac();
			return [
				...this.src.writeTo(generator, dst),
				...new Copy(this.dst, generator.ac()).toCommand(generator)
			];
		}

		const dst = this.dst.toStoreTarget(generator);
		const src = this.src.toStoreValue(generator);
		return [`execute store result ${dst} ${src}`];
	}
}

export type ArithmeticOperator = "+"|"-"|"*"|"/"|"%";
export interface ArithmeticOperation {
	op: ArithmeticOperator;
	value: ScoreAccess|NumberVariable|NumberConstant;
}

export class ArithmeticSequence {
	constructor(
		public dst: ScoreAccess|NumberVariable|NumberConstant,
		public operations: ArithmeticOperation[],
	) {}
}



export class Arithmetic {
	constructor(
		public lhs: ScoreAccess|NumberVariable|NumberConstant,
		public op: ArithmeticOperator,
		public rhs: ScoreAccess|NumberVariable|NumberConstant,
	) {}

	serialize() {
		return `${this.lhs.serialize()} ${this.op} ${this.rhs.serialize()}`;
	}

	writeTo(generator: CodeGenerator, destination: ScoreAccess|NumberVariable) {
		const out: string[] = [];
		if (!destination.sameAs(this.lhs)) {
			out.push(...new Copy(destination, this.lhs).toCommand(generator));
		}

		out.push(...new ScoreOperation(destination, this.op, this.rhs).toCommand(generator));
		return out;
	}
}

export type GotoSubcommand = MCSubcommand | Compare | NumberConstant | NumberVariable | ScoreAccess;
export class Goto implements Instruction {
	constructor(
		public subcommands: GotoSubcommand[],
		public block: string,
	) {}

	serialize(): string {
		const then = `/function ${this.block}`;
		if (!this.subcommands.length) return then;
		return `if (${this.subcommands.map(i=>i.serialize()).join(" && ")}) ${then}`;
	}

	toCommand(generator: CodeGenerator): string[] {
		const command = generator.generateBlock(this.block);
		const subcommands = this.subcommands.map(i=>Goto._toSubcommand(i).toSubcommand(generator));
		if (!subcommands.length) return [command];
		return [`execute ${subcommands.join(" ")} run ${command}`];
	}

	private static _toSubcommand(subcommand: GotoSubcommand): MCSubcommand | Compare {
		if (subcommand instanceof MCSubcommand) return subcommand;
		if (subcommand instanceof Compare) return subcommand;
		return new Compare(subcommand, "!=", new NumberConstant(0));
	}
}


export class MCCommand implements Instruction {
	constructor(
		public command: string
	) { }

	isComment() {
		return this.command[0] === "#";
	}

	serialize() {
		if (this.isComment()) return this.command;
		return "/"+this.command;
	}

	toCommand() {
		return [ this.command ];
	}
}

export class ScoreOperation implements Instruction {
	constructor(
		public dst: ScoreAccess|NumberVariable,
		public op: ArithmeticOperator|"=",
		public src: ScoreAccess|NumberVariable|NumberConstant,
	) { }

	toCommand(generator: CodeGenerator): string[] {
		const normalized = this.normalize();
		const dst = generator.toScore(normalized.dst);

		if (normalized.src instanceof NumberConstant) {
			let opName = "";
			switch (normalized.op) {
				case "=": opName = "set"	; break;
				case "+": opName = "add"	; break;
				case "-": opName = "remove"	; break;
			}

			if (opName) {
				return [`scoreboard players ${opName} ${dst.fragment()} ${normalized.src.value | 0}`];
			}
		}

		const src = generator.toScore(normalized.src);
		return [`scoreboard players operation ${dst.fragment()} ${ScoreOperation._assignmentOp(normalized.op)} ${src.fragment()}`];
	}

	serialize() {
		return `${this.dst.serialize()} ${ScoreOperation._assignmentOp(this.op)} ${(this.src as ScoreAccess).serialize?.() || this.src}`;
	}

	normalize() {
		if (this.src instanceof NumberConstant && 0 < this.src.value && this.src.value < 1) {
			switch (this.op) {
				case "+": return new ScoreOperation(this.dst, "-", new NumberConstant(-this.src.value));
				case "-": return new ScoreOperation(this.dst, "+", new NumberConstant(-this.src.value));
				case "*": return new ScoreOperation(this.dst, "/", new NumberConstant(1/this.src.value));
				case "/": return new ScoreOperation(this.dst, "*", new NumberConstant(1/this.src.value));
			}
		}
		return this;
	}

	private static _assignmentOp(op: ArithmeticOperator|"=") {
		if (op === "=") return op;
		return op + "=";
	}
}