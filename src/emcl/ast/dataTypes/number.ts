import * as mil from "../../../mil/mil.js";
import { Context } from "../../Compiler.js";
import { Type, Address, Value, ToSubcommands } from "../astNode.js";
import { NBT, Score } from "./addresses.js";

export class NumberType extends Type {
	constructor(
		public resolution: number,
		public final = false,
		public constant = false,
	) { super(final, constant); }
	
	displayName(): string {
		let name = `float<${this.resolution}>`;
		if (this.resolution === NumberType.INT) name = "int";
		if (this.resolution === NumberType.FLOAT) name = "float";
		return (this.constant ? "const " : "") + name;
	}

	sameAs(type: Type): boolean {
		return type instanceof NumberType && this.resolution === type.resolution;
	}

	toSubcommands(ctx: Context, address: Address) {
		const score = this._toMIL(this._constantOrScore(ctx, address)) as mil.NumberConstant|mil.ScoreAccess|mil.NumberVariable;

		return new ToSubcommands([score]);
	}

	alloc(ctx: Context, preferredName?: string): Score {
		return new Score(ctx.createTemporary(preferredName));
	}

	copy(ctx: Context, destination: Address, source: Address) {
		ctx.out.push(
			new mil.Copy(
				this._toMIL(destination) as any,
				this._toMIL(source), 
			)
		);
	}

	cast(ctx: Context, newType: Type, source: Address): Address {
		if (newType instanceof NumberType) {
			if (source instanceof NumberConstant) return source;
			if (source instanceof NBT) return source;
			if (source instanceof Score) {
				const address = this.alloc(ctx);

				const milValue = new mil.Arithmetic(source.address, "*", new mil.NumberConstant(newType.resolution / this.resolution));
				ctx.out.push(new mil.Copy(address.address, milValue));

				return address;
			}
		}
		
		return super.cast(ctx, newType, source);
	}

	binaryOp(ctx: Context, lhs: Value, op: string, rhs: Value): Value {
		// cast lhs and rhs to the same type
		const res = Math.max(
			this.resolution, 
			rhs.type instanceof NumberType ? rhs.type.resolution : this.resolution
		);
		
		const type = new NumberType(res);
		const lhsA = this._constantOrScore(ctx, lhs.cast(ctx, type).address);
		const rhsA = this._constantOrScore(ctx, rhs.cast(ctx, type).address);

		const dst = type.alloc(ctx);

		if (op === "<" || op === "<=" || op === "==" || op === ">=" || op === ">" || op === "!=") {
			const compare = new mil.Compare(type._toMIL(lhsA) as any, op, type._toMIL(rhsA) as any);
			ctx.out.push(new mil.Copy(dst.address, compare));
			return new Value(type, dst);
		}


		const threeAddress = (dst: Score, lhs: Score|NumberConstant, op: string, rhs: Score|NumberConstant)=>{
			return new mil.Copy(
				dst.address,
				new mil.Arithmetic(type._toMIL(lhs) as any, op as mil.ArithmeticOperator, type._toMIL(rhs) as any)
			);
		}

		if (op === "+" || op === "-" || op === "%") {
			// dst = lhsA
			// dst op rhsA
			ctx.out.push(threeAddress(dst, lhsA, op, rhsA));
			return new Value(type, dst);
		}

		if (op === "*") {
			// dst = lhsA
			// dst * rhsA
			// dst / RES
			ctx.out.push(threeAddress(dst, lhsA, op, rhsA));
			ctx.out.push(new mil.Copy(
				dst.address,
				new mil.Arithmetic(type._toMIL(dst) as any, "/", new mil.NumberConstant(res))
			));
			return new Value(type, dst);
		}

		if (op === "/") {
			// dst = lhsA
			// dst * RES
			// dst / rhsA
			ctx.out.push(new mil.Copy(
				dst.address,
				new mil.Arithmetic(type._toMIL(lhsA) as any, "*", new mil.NumberConstant(res))
			));
			ctx.out.push(threeAddress(dst, dst, op, rhsA));
			return new Value(type, dst);
		}

		return super.binaryOp(ctx, lhs, op, rhs);
	}

	static readonly INT = 1;
	static readonly FLOAT = 100;

	static constant(value: number, resolution: number) {
		return new Value(new NumberType(resolution, true, true), new NumberConstant(value));
	}

	private _toMIL(address: Address) {
		if (address instanceof Score) return address.address;
		if (address instanceof NBT) return new mil.ScaledNBTAccess(address.address, this.resolution);
		if (address instanceof NumberConstant) return new mil.NumberConstant(address.value * this.resolution);
		throw new Error("Tried to use an unsupported address type");
	}

	private _constantOrScore(ctx: Context, address: Address) {
		if (address instanceof Score || address instanceof NumberConstant) return address;
		const destination = this.alloc(ctx);
		this.copy(ctx, destination, address);
		return destination;	
	}
}

export class NumberConstant extends Address {
	constructor(
		public value: number,
	) { super(); }
}