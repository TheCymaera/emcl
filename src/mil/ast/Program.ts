import { Instruction } from "./instructions.js";
import { NumberConstant, ScoreAccess, NumberVariable } from "./storage.js";

export class Program {
	blocks: Map<string, Instruction[]> = new Map;

	config: Config;

	generate(): CodeGenerator {
		const generator = new CodeGenerator(this);

		for (const [id] of this.blocks) {
			// ignore instrumental-blocks as they will be generated when needed.
			if (id[0] === "_") continue;
			
			generator.generateBlock(id);
		}

		return generator;
	}

	clone() {
		const clone = new Program;
		clone.blocks = new Map(this.blocks);
		
		return clone;
	}
}

export interface Config {
	initializer: string;
	destructor: string;
	scoreboardNamespace: string;
	functionNamespace: string;
}

export class CodeGenerator {
	readonly mcfunctions: Map<string, string[]> = new Map;
	readonly scores: Set<ScoreAccess> = new Set;

	constructor(
		public program: Program,
	) {}
	

	ac() {
		this._createObjective = true;
		return new ScoreAccess(this._objective(), "AC");
	}
	
	toScore(store: ScoreAccess|NumberVariable|NumberConstant): ScoreAccess {
		const register = (score: ScoreAccess)=>{
			for (const compare of this.scores) {
				if (compare.sameAs(store)) this.scores.delete(compare);
			}
			this.scores.add(score);
			return score;
		}

		if (store instanceof ScoreAccess) return register(store);

		if (store instanceof NumberVariable) {
			const score = new ScoreAccess(this._objective(), "T_"+store.id);
			this._createObjective = true;
			return register(score);
		}
		if (store instanceof NumberConstant) {
			const rounded = Math.round(store.value);
			const score = new ScoreAccess(this._objective(), "C_"+rounded);
			this._createObjective = true;
			this._constantScores.set(rounded, score);
			return register(score);
		}

		throw new Error(`Cannot convert ${store} to score`);
	}

	generateBlock(id: string): string {
		const realName = this._functionName(id);

		// return if block has been generated.
		if (this._generated.has(id)) {
			const commands = this._generated.get(id)!;
			if (commands.length === 1) return commands[0]!;
			return `function ${realName}`;
		}

		// generate block
		const block = this.program.blocks.get(id);
		if (!block) return `function ${realName}`;

		this._generated.set(id, []);
		const commands = block.map(i=>i.toCommand(this)).flat(1);
		this._generated.set(id, commands);

		// output block commands
		if (id[0] !== "_" || commands.length !== 1) this.mcfunctions.set(realName, commands);

		return this.generateBlock(id);
	}

	files() {
		const blocks = new Map(this.mcfunctions);
		const initializer = blocks.get(this.program.config.initializer) || [];
		const destructor = blocks.get(this.program.config.destructor) || [];

		initializer.unshift(...this.initializer());
		destructor.push(...this.destructor());

		blocks.set(this.program.config.initializer, initializer);
		blocks.set(this.program.config.destructor, destructor);

		const files: Map<string, string> = new Map;
		for (const [namespacedId, block] of blocks) {
			const [namespace, id] = namespacedId.split(":");
			const path = `data/${namespace}/functions/${id}.mcfunction`;
			files.set(path, block.join("\n"));
		}
		return files;
	}

	initializer() {
		const out: string[] = [];
		if (this._createObjective) {
			out.push(`scoreboard objectives add ${this._objective()} dummy "MIL Internal"`);
		}

		for (const [value, score] of this._constantScores) {
			out.push(`scoreboard players set ${score.target} ${this._objective()} ${value}`);
		}

		return out;
	}

	destructor() {
		if (this._createObjective) {
			return [ `scoreboard objectives remove ${this._objective()}` ];
		}

		return [];
	}


	private _createObjective = false;
	private _constantScores: Map<number, ScoreAccess> = new Map;
	private _generated: Map<string, string[]> = new Map;
	private _objective() {
		return this.program.config.scoreboardNamespace + "r";
	}
	private _functionName(id: string) {
		if (id[0] === "_") return this.program.config.functionNamespace + id.slice(1);
		return id;
	}
}