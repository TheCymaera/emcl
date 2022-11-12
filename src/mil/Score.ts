import { DataType } from "./DataType.js";
import { GenerationContext } from "./Program.js";

export abstract class Score {
	readonly dataType: DataType.Int;
	abstract scorePointer(ctx: GenerationContext): string;
	abstract displayText(): string;
	abstract sameTargetAs(other: unknown): boolean;
	abstract isTemporary(): boolean;
	abstract isStatic(): boolean;
	abstract isLocallyStatic(): boolean;

	sameAs(other: unknown) {
		return this.sameTargetAs(other);
	}
}

export class ScorePointer extends Score {
	readonly dataType: DataType.Int;
	constructor(public objective: string, public target: string) { super();  }

	scorePointer(): string {
		return this.target + " " + this.objective;
	}

	displayText(): string {
		return `score ${JSON.stringify(this.objective)} ${JSON.stringify(this.target)}`
	}

	isTemporary() {
		return false;
	}

	sameTargetAs(other: unknown) {
		return other instanceof ScorePointer && this.objective === other.objective && this.target === other.target;
	}

	isStatic() {
		return this.target[0] !== "@";
	}

	isLocallyStatic() {
		if (this.isStatic()) return true;
		return _locallyStaticSelectors.has(this.target);
	}
}

export class ScoreVariable extends Score {
	readonly dataType: DataType.Int;
	constructor(public name: string) { super(); }

	scorePointer(ctx: GenerationContext): string {
		return ctx.internalScore(this.name);
	}

	displayText(): string {
		return `score ${this.name}`
	}

	isTemporary() {
		return true;
	}

	sameTargetAs(other: unknown) {
		return other instanceof ScoreVariable && this.name === other.name;
	}

	isStatic() {
		return true;
	}

	isLocallyStatic() {
		return true;
	}
}

const _locallyStaticSelectors = new Set(["@a", "@p", "@s", "@e"]);