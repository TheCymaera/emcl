import { DataType } from "./DataType.js";
import { GenerationContext } from "./Program.js";

export abstract class NBT {
	abstract dataType: DataType;
	abstract clone(): NBT;
	abstract displayText(): string;
	abstract nbtPointer(ctx: GenerationContext): string;
	abstract sameTargetAs(other: unknown): boolean;
	abstract isTemporary(): boolean;
	abstract isStatic(): boolean;
	abstract isLocallyStatic(): boolean;

	sameAs(other: unknown) {
		return this.sameTargetAs(other) && this.dataType === (other as NBT).dataType; 
	}
}

export class NBTPointer extends NBT {
	constructor(
		public kind: string,
		public target: string,
		public path: string,
		public dataType: DataType,
	) { super(); }

	clone() {
		return new NBTPointer(this.kind, this.target, this.path, this.dataType);
	}

	displayText() {
		return `${this.dataType} nbt ${JSON.stringify(this.kind)} ${JSON.stringify(this.target)} ${JSON.stringify(this.path)}`;
	}

	nbtPointer(ctx: GenerationContext) {
		return `${this.kind} ${this.target} ${this.path}`;
	}

	sameTargetAs(other: unknown) {
		return other instanceof NBTPointer && 
		this.kind === other.kind && 
		this.target === other.target && 
		this.path === other.path;
	}

	isTemporary() {
		return false;
	}

	isStatic() {
		return this.target === "storage";
	}

	isLocallyStatic() {
		if (this.isStatic()) return true;
		if (this.kind === "entity" && _locallyStaticSelectors.has(this.target)) return true;
		return false;
	}
}

export class NBTVariable extends NBT {
	constructor(public name: string, public dataType: DataType) { super(); }

	clone() {
		return new NBTVariable(this.name, this.dataType);
	}

	displayText() {
		return this.name;
	}

	nbtPointer(ctx: GenerationContext) {
		return ctx.internalNBT(this.name);
	}

	sameTargetAs(other: unknown) {
		return other instanceof NBTVariable && this.name === other.name;
	}

	isTemporary() {
		return true;
	}

	isStatic() {
		return true;
	}

	isLocallyStatic() {
		return true;
	}
}

const _locallyStaticSelectors = new Set(["@a", "@p", "@s", "@e"]);