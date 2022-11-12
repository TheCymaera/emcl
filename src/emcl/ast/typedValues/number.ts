import { Context } from "../../compilation/Compiler.js";
import { Type, Value } from "../astNode.js";
import * as mil from "mil";
import { NumberConstant } from "mil";


export class NumberType extends Type {
	constructor(public dataType: mil.NumberType) { super(); }

	displayName() {
		return this.minecraftName();
	}

	minecraftName(): string {
		return this.dataType;
	}

	isInstance(value: Value): boolean {
		return value instanceof NumberValue && value.type.dataType === this.dataType;
	}

	createVariable(ctx: Context, options: Type.CreateValueOptions): Value {
		const name = ctx.compilation.createUniqueName(options.preferredName);
		if (mil.NumberType.isDecimal(this.dataType)) {
			return new NumberValue(this, new mil.NBTVariable(name, this.dataType));
		} else {
			return new NumberValue(this, new mil.ScoreVariable(name));
		}
	}
}

export class NumberValue extends Value {
	constructor(
		public type: NumberType,
		public value: mil.Score|mil.NBT|mil.NumberConstant
	) { super(); }

	static constant(dataType: mil.NumberType, value: number) {
		return new NumberValue(new NumberType(dataType), new mil.NumberConstant(value, dataType));
	}

	displayName(): string {
		return this.type.fullDisplayName();
	}

	isConst() {
		return this.value instanceof NumberConstant;
	}

	assignToConst(ctx: Context, type: Type) {
		if (type instanceof NumberType) return this;
		return this.assignToConst(ctx, type);
	}

	assignToVariable(ctx: Context, dst: Value): void {
		const src = this;

		if (dst instanceof NumberValue) {
			if (dst instanceof NumberConstant) throw ctx.semanticError(`Cannot assign to a 'const' number!`);

			ctx.appendCommand(new mil.Assignment(dst._toVariableMIL(), src._toMIL()));
			return;
		}

		return super.assignToVariable(ctx, dst);
	}

	binaryOp(ctx: Context, op: string, rhs: Value): Value {
		const returnKind = rhs instanceof NumberValue ?
		mil.NumberType.maxSpecificity(this.type.dataType, rhs.type.dataType) :
		this.type.dataType;
		
		const returnType = new NumberType(returnKind);
		const returnTypeFinal = new NumberType(returnKind);
		returnTypeFinal.isFinal = true;

		const lhsCasted = returnType.initialize(ctx, this, { preferredName: "binaryOp" }) as NumberValue;
		const rhsCasted = returnTypeFinal.initialize(ctx, rhs, { preferredName: "binaryOpRhs" }) as NumberValue;

		switch(op) {
			case "<": 
			case ">": 
			case "<=": 
			case ">=": 
			case "==": 
			case "!=": {
				const expression = new mil.Compare(lhsCasted._toMIL(), op, rhsCasted._toMIL());
				ctx.appendCommand(new mil.Assignment(lhsCasted._toVariableMIL(), expression));
				return lhsCasted;
			}

			case "+":
			case "-":
			case "%":
			case "*":
			case "/": {
				const expression = new mil.Arithmetic(lhsCasted._toMIL(), op, rhsCasted._toMIL());
				ctx.appendCommand(new mil.Assignment(lhsCasted._toVariableMIL(), expression));
				return lhsCasted;
			}
		}

		return super.binaryOp(ctx, op, rhs);
	}

	truthy(ctx: Context) {
		return new mil.Compare(this._toMIL(), "!=", new mil.NumberConstant(0, mil.DataType.Int));
	}

	private _toMIL() {
		if (this.value instanceof mil.Score) return this.value;
		if (this.value instanceof mil.NBT) {
			const out = this.value.clone();
			out.dataType = this.type.dataType;
			return out;
		}
		return new mil.NumberConstant(this.value.value, this.type.dataType);
	}

	private _toVariableMIL() {
		return this._toMIL() as mil.Score | mil.NBT;
	}
}