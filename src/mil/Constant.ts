import { DataType, NumberType } from "./DataType.js";
import { GenerationContext } from "./Program.js";

export abstract class Constant {
	abstract readonly dataType: DataType;
	abstract nbtLiteral(): string;
	abstract sameAs(other: unknown): boolean;
	displayText() {
		return this.nbtLiteral();
	}

	nbtPointer(ctx: GenerationContext) {
		return ctx.constantNBT(this.nbtLiteral());
	}
}

export class NumberConstant extends Constant {
	constructor(public value: number, public dataType: NumberType) { super(); }

	nbtLiteral() {
		return this.value.toString() + this._suffix();
	}

	sameAs(other: unknown): boolean {
		return other instanceof NumberConstant && other.value === this.value && other.dataType === this.dataType;
	}

	scorePointer(ctx: GenerationContext) {
		return ctx.constantScore(this.value);
	}

	static double(value: number) {
		return new NumberConstant(value, DataType.Double);
	}

	static equals(numberConstant: unknown, number: number) {
		return numberConstant instanceof NumberConstant && numberConstant.value === number;
	}

	private _suffix() {
		switch (this.dataType) {
			case DataType.Byte: return "b";
			case DataType.Short: return "s";
			case DataType.Int: return "";
			case DataType.Long: return "l";
			case DataType.Float: return "f";
			case DataType.Double: return "d";
		}
	}
}

export class StringConstant extends Constant {
	readonly dataType = DataType.String;
	constructor(public value: string) { super(); }

	displayText() {
		return this.nbtLiteral();
	}

	sameAs(other: unknown): boolean {
		return other instanceof StringConstant && other.value === this.value;
	}

	nbtLiteral() {
		return JSON.stringify(this.value);
	}
}