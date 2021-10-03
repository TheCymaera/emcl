import { CodeGenerator } from "./Program.js";
import { NumberConstant, NumberVariable, ScoreAccess } from "./storage.js";

export type CompareOperator = "<"|"<="|">"|">="|"=="|"!=";
export class Compare {
	constructor(
		public lhs: ScoreAccess|NumberVariable|NumberConstant,
		public op: CompareOperator, 
		public rhs: ScoreAccess|NumberVariable|NumberConstant,
	) { }
	
	serialize() {
		return `${this.lhs.serialize()} ${this.op} ${this.rhs.serialize()}`;
	}

	flip() {
		switch(this.op) {
			case "<" : return new Compare(this.rhs, ">", this.lhs);
			case ">" : return new Compare(this.rhs, "<", this.lhs);
			case "<=": return new Compare(this.rhs, ">=", this.lhs);
			case ">=": return new Compare(this.rhs, "<=", this.lhs);
			case "==": return new Compare(this.rhs, "==", this.lhs);
			case "!=": return new Compare(this.rhs, "!=", this.lhs);
		}
	}

	toSubcommand(generator: CodeGenerator) {
		if (this.lhs instanceof NumberConstant && !(this.rhs instanceof NumberConstant)) {
			return this.flip().toSubcommand(generator);
		}

		const lhs = generator.toScore(this.lhs);

		if (this.rhs instanceof NumberConstant) {
			const rhs = this.rhs.value | 0;
			switch (this.op) {
				case "<"	: return `if score ${lhs.fragment()} matches ..${rhs - 1}`;
				case "<="	: return `if score ${lhs.fragment()} matches ..${rhs}`;
				case ">"	: return `if score ${lhs.fragment()} matches ${rhs}..`;
				case ">="	: return `if score ${lhs.fragment()} matches ${rhs + 1}..`;
				case "=="	: return `if score ${lhs.fragment()} matches ${rhs}`;
				case "!="	: return `unless score ${lhs.fragment()} matches ${rhs}`;
			}
		} else {
			const rhs = generator.toScore(this.rhs);
			if (this.op === "!=") return `unless score ${lhs.fragment()} = ${rhs.fragment()}`;
			
			const op = this.op === "==" ? "=" : this.op;
			return `if score ${lhs.fragment()} ${op} ${rhs.fragment()}`;
		}
	}

	toStoreValue(generator: CodeGenerator) {
		return this.toSubcommand(generator);
	}
}


export class MCSubcommand {
	constructor(
		public subcommand: string
	) { }

	serialize() {
		return "mcsubcommand "+JSON.stringify(this.subcommand);
	}

	toSubcommand() {
		return this.subcommand;
	}
}