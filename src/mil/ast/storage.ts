import { CodeGenerator } from "./Program.js";

export class NumberConstant {
	constructor(
		public value: number
	) {}

	serialize() {
		return `${this.value}`;
	}

	sameAs(compare: any) {
		return compare instanceof NumberConstant && this.value === compare.value;
	}

	toStoreValue(generator: CodeGenerator): string {
		return generator.toScore(this).toStoreValue();
	}

	static is(value: any, constant: number) {
		return value instanceof NumberConstant && value.value === constant;
	}
}

export class NumberVariable {
	constructor(
		public id: string, 
	) { }
	
	serialize() {
		return this.id;
	}

	sameAs(compare: any) {
		return compare instanceof NumberVariable && this.id === compare.id;
	}

	toStoreTarget(generator: CodeGenerator): string {
		return generator.toScore(this).toStoreTarget();
	}

	toStoreValue(generator: CodeGenerator): string {
		return generator.toScore(this).toStoreValue();
	}
}

export class ScoreAccess {
	constructor(
		public objective: string, 
		public target: string
	) { }

	serialize() {
		return `score ${JSON.stringify(this.objective)} ${JSON.stringify(this.target)}`;
	}

	sameAs(compare: any): boolean {
		return compare instanceof ScoreAccess && this.fragment() === compare.fragment();
	}

	isStatic() {
		return this.target[0] !== "@";
	}

	isLocallyStatic() {
		return this.isStatic() || 
			this.target === "@p" || 
			this.target === "@s" || 
			this.target === "@a" ||
			this.target === "@e";
	}

	fragment() {
		return `${this.target} ${this.objective}`;
	}
	
	toStoreTarget(): string {
		return `score ${this.fragment()}`;
	}

	toStoreValue(): string {
		return `run scoreboard players get ${this.fragment()}`;
	}
}

export class ScaledNBTAccess {
	constructor(
		public source: NBTAccess,
		public scale: number,
	) {}

	sameAs(compare: any) {
		return compare instanceof ScaledNBTAccess && compare.source.sameAs(this.source);
	}

	serialize() {
		return `${this.source.serialize()} * ${this.scale}`;
	}

	toStoreTarget() {
		return `${this.source.fragment()} ${this.source.dataType} ${1/this.scale}`;
	}

	toStoreValue(): string {
		return `${this.source.toStoreValue()} ${this.scale}`;
	}
}

export class NBTAccess {
	constructor(
		public kind: string, 
		public target: string, 
		public path: string, 
		public dataType = "unknown"
	) {}

	sameAs(compare: any) {
		return compare.kind === this.kind && 
			compare.target === this.target && 
			compare.path === this.path && 
			compare.dataType === this.dataType;
	}

	serialize() {
		return `nbt ${JSON.stringify(this.kind)} ${JSON.stringify(this.target)} ${JSON.stringify(this.path)}`;
	}

	fragment(): string {
		return `${this.kind} ${this.target} ${this.path}`;
	}

	toStoreValue(): string {
		return `run data get ${this.fragment()}`;
	}
}
