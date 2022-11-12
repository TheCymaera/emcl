import { Goto, MCCommand } from "./controlFlow.js";
import { DataType, NumberType } from "./DataType.js";
import { Instruction } from "./instructions.js";
import { ScorePointer, Score, ScoreVariable } from "./Score.js";
import * as codeGeneration from "./codeGeneration/";
import { NBT, NBTPointer, NBTVariable } from "./NBT.js";
import { Constant, NumberConstant } from "./Constant.js";

/**
 * Control flow or instruction.
 */
export type InstructionLike = Instruction | Goto | MCCommand;

/**
 * Program configuration.
 */
export interface ProgramConfig {
	initializer: string,
	destructor: string,
	mainScoreboard: string,
	mainNBTStorage: string,
	floatResolution: number,
	doubleResolution: number,
}

/**
 * MIL Program
 */
export class Program {
	constructor(public config: ProgramConfig) {}
	
	/**
	 * Branches
	 */
	branches: Map<string, InstructionLike[]> = new Map;

	/**
	 * Clone program. (Does not clone instructions.)
	 */
	clone() {
		const out = new Program(this.config);
		for (const [name, block] of this.branches) out.branches.set(name, [...block]);
		return out;
	}

	/**
	 * Generate program.
	 */
	generate() {
		const out = new Generation(this);
		for (const [name] of this.branches) out.generate(name);
		return out;
	}

	/**
	 * Check if a branch can be inlined.
	 */
	canInline(name: string) {
		return name[0] === "_";
	}
}

export class Generation {
	constructor(readonly program: Program) {}

	readonly constantScores: Set<number> = new Set;
	readonly constantNBTs: Map<string, string> = new Map;
	readonly acs: Set<string> = new Set;

	/**
	 * Generated branches, excluding initializer and destructor.
	 */
	readonly generated: Map<string, string[]> = new Map;

	/**
	 * Indicates that the program uses the internal scoreboard.
	 * If true, the scoreboard will be created in the initializer.
	 */
	usesInternalScoreboard = false;

	/**
	 * Returns a map of file paths and text files.
	 */
	files(): Map<string, string> {
		const out: Map<string, string> = new Map;
		for (const [namespacedId, commands] of this.mcfunctions()) {
			const [namespace, id] = namespacedId.split(":");
			const path = `data/${namespace}/functions/${id}.mcfunction`;
			out.set(path, commands.join("\n"));
		}
		return out;
	}

	/**
	 * Returns a map of namespaced ids and commands.
	 */
	mcfunctions(): Map<string, string[]> {
		const out: Map<string, string[]> = new Map;
		for (const [name, generated] of this.generated) {
			if (this.canInline(name, generated)) continue;
			out.set(this.branchNamespacedId(name), [...generated]);
		}

		// prepend initializer
		const initializerName = this.program.config.initializer;
		const initializerBranch = out.get(initializerName) ?? [];
		out.set(initializerName, [...this.initializer(), ...initializerBranch]);

		// append destructor
		const destructorName = this.program.config.destructor;
		const destructorBranch = out.get(destructorName) ?? [];
		out.set(destructorName, [...destructorBranch, ...this.destructor()]);

		return out;
	}

	/**
	 * Returns initializer commands.
	 */
	initializer() {
		const ctx = new GenerationContext(this, []);
		if (this.usesInternalScoreboard) {
			codeGeneration.score.createObjective(ctx, this.program.config.mainScoreboard, "INTERNAL");
		}

		for (const constant of this.constantScores) {
			const score = new ScorePointer(this.program.config.mainScoreboard, "C_" + constant);
			codeGeneration.score.operation(ctx, score, "=", NumberConstant.double(constant));
		}

		return ctx.out;
	}

	/**
	 * Returns destructor commands.
	 */
	destructor() {
		const ctx = new GenerationContext(this, []);
		if (this.usesInternalScoreboard) {
			codeGeneration.score.removeObjective(ctx, this.program.config.mainScoreboard);
		}

		codeGeneration.nbt.remove(ctx, new NBTPointer("storage", this.program.config.mainNBTStorage, "variables", DataType.Int))
		return ctx.out;
	}

	/**
	 * Generates the specified branch and returns a command for invoking the branch.
	 */
	generate(branchName: string): string {
		// generate branch if it has not been generated.
		if (!this.generated.has(branchName)) {
			const block = this.program.branches.get(branchName);
			if (!block) return "function " + this.branchNamespacedId(branchName);
	
			// prevent premature inlining while the branch is being generated.
			this.generated.set(branchName, []);

			// generate instructions
			const ctx = new GenerationContext(this, []);
			for (const instruction of block) {
				instruction.generate(ctx);
				this.acs.clear();
			}
			this.generated.set(branchName, ctx.out);
		}

		const generated = this.generated.get(branchName);
		if (generated && this.canInline(branchName, generated)) return generated[0]!;

		return "function " + this.branchNamespacedId(branchName);
	}

	/**
	 * Check if a generated branch can be inlined.
	 */
	canInline(branchName: string, generated: string[]) {
		return generated.length === 1 && generated[0]![0] !== "#" && this.program.canInline(branchName);
	}

	/** 
	 * Get branch name as namespaced id
	 */
	branchNamespacedId(name: string) {
		return name[0] === "_" ? name.slice(1) : name;
	}
}

export class GenerationContext {
	constructor(
		readonly generation: Generation,
		readonly out: string[],
	) {}

	appendCommand(command: string) {
		this.out.push(command);
	}

	constantScore(number: number) {
		this.generation.usesInternalScoreboard = true;
		const int = number | 0;
		this.generation.constantScores.add(int);

		const player = "C_" + int;
		const objective = this.generation.program.config.mainScoreboard;
		return  `${player} ${objective}`;
	}

	internalScore(name: string) {
		const player = "variables." + name;
		const objective = this.generation.program.config.mainScoreboard;
		return  `${player} ${objective}`;
	}

	constantNBT(nbtLiteral: string) {
		const id = this.generation.program.config.mainNBTStorage;
		const path = this.generation.constantNBTs.get(nbtLiteral) ?? `constants.${this.generation.constantNBTs.size}`;
		this.generation.constantNBTs.set(nbtLiteral, path);
		return `storage ${id} ${path}`;
	}

	internalNBT(name: string) {
		const id = this.generation.program.config.mainNBTStorage;
		const path = "variables." + name;
		return  `storage ${id} ${path}`;
	}

	resolutionOf(numberType: DataType): number {
		switch (numberType) {
			case DataType.Byte:
			case DataType.Short:
			case DataType.Int:
			case DataType.Long: return 1;

			case DataType.Float: return this.generation.program.config.floatResolution;
			case DataType.Double: return this.generation.program.config.doubleResolution;
		}
		return 1;
	}

	ac(): Score {
		this.generation.usesInternalScoreboard = true;
		let name = "AC", i = 0;
		while (this.generation.acs.has(name)) name = "AC_" + i++;
		this.generation.acs.add(name);
		return new ScorePointer(this.generation.program.config.mainScoreboard, name);
	}
}