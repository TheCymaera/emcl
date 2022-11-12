import { ASTNode, Value } from "../ast/astNode.js";
import { SymbolTable } from "../../compiler-builder/SymbolTable.js";
import * as parserPipeline from "./parserPipeline.js";
import { Config } from "./Config.js";
import * as mil from "mil";
import * as milOptimizer from "mil-optimizer";
import { VoidValue } from "../ast/typedValues/void.js";
import { minecraftModule } from "../native-modules/minecraft.js";
import { Module } from "./Module.js";
import { FileSystem, ReadonlyURI } from "file-system";

export class Compiler {
	fileSystem: FileSystem;
	console: Console;
	uri: ReadonlyURI;
	noOut = false;

	readonly beforeCompile: Set<(this: this)=>any> = new Set;
	readonly onLoadConfig: Set<(this: this, compilation: Compilation)=>any> = new Set;
	readonly onImportModule: Set<(this: this, compilation: Compilation, uri: ReadonlyURI)=>any> = new Set;
	readonly onCompile: Set<(this: this, compilation: Compilation)=>any> = new Set;
	readonly onTransform: Set<(this: this, compilation: Compilation, changes: milOptimizer.Changes)=>any> = new Set;
	readonly onGenerateCode: Set<(this: this, compilation: Compilation)=>any> = new Set;
	readonly onComplete: Set<(this: this)=>any> = new Set;


	async compile() {
		if (!this.uri) return this.console.error(`No project loaded.`);

		try {
			const out = await this._compile();
			for (const callback of this.onComplete) callback.call(this);
			return out;
		} catch(e) {
			const expected = (e instanceof IOError) || (e instanceof SemanticError);
			if (!expected) {
				this.console.error("Encountered unexpected error.");
				this.console.error(e.message);
			}
			for (const callback of this.onComplete) callback.call(this);
			throw e;
		}
	}

	logError(error: Error): typeof error {
		this.console.error(error.message);
		return error;
	}

	private async _compile() {
		for (const callback of this.beforeCompile) callback.call(this);
		this.console.log(`Input Directory: ${this.uri.toString()}`);

		// read config
		const configURI = this.uri.clone().asDirectory().descend([], "emcl.config.json");
		this.console.log(`Loading config file: ${this.uri.relativePathOf(configURI)}`);
		const configText = await this.fileSystem.readTextFile(configURI).catch(e=>{
			throw this.logError(new IOError(e.message));
		});;
		
		// parse config
		const parseConfig = Config.parse(configText);
		if (parseConfig.error) throw this.logError(new IOError(parseConfig.error));
		const config = parseConfig.config!;

		// lint config
		Config.validate(config, configURI, this.console);

		// compilation
		this.console.log(`Compiling...`);
		const compilation = new Compilation(this, config, configURI);
		for (const callback of this.onLoadConfig) callback.call(this, compilation);

		const entryURI = this.uri.clone().appendString(compilation.config.entry);
		await compilation.importModule(entryURI, compilation.config.initializer);
		for (const callback of this.onCompile) callback.call(this, compilation);

		// optimization
		this.console.log(`Optimizing program...`);
		let optimizerCycles = 0;
		const maxOptimizerCycles = 10000;
		while (true) {
			const changes = milOptimizer.applyAll(compilation.program);
			if (!changes) break;
			for (const callback of this.onTransform) callback.call(this, compilation, changes);

			optimizerCycles++;
			if (optimizerCycles > maxOptimizerCycles) {
				this.console.error(`The optimizer stopped as it exceeded ${maxOptimizerCycles} cycles. Please report this as a bug along with the steps to reproduce.`);
				break;
			}
		}

		// code generation
		this.console.log(`Generating code...`);
		const generation = compilation.program.generate();
		for (const [path, content] of generation.files()) compilation.files.set(path, content);
		for (const [path, content] of compilation.extraFiles()) compilation.files.set(path, content);
		for (const callback of this.onGenerateCode) callback.call(this, compilation);

		// write files
		if (this.noOut) {
			this.console.warn(`No files were created as "noOut" is true.`);
		} else if (compilation.config.destination) {
			const destinationRoot = this.uri.clone().appendString(compilation.config.destination).asDirectory();
			this.console.log(`Output Directory: ${destinationRoot}`);

			for (const [path, content] of compilation.files) {
				const uri = destinationRoot.clone().appendString(path);

				this.console.log(`Writing file: ${path}`);
				await this.fileSystem.writeTextFile(uri, content).catch((e)=>{
					throw this.logError(new IOError(e.message));
				});
			}
			this.console.log(`Created all files successfully.`);
		} else {
			this.console.warn(`No files were created as "config.destination" was not specified.`);
		}

		return compilation;
	}
}

export class Compilation {
	readonly program: mil.Program;
	readonly modules = new Map<string, Module>()
	.set("minecraft:core", minecraftModule);

	readonly temporaries: Set<string> = new Set;
	readonly files: Map<string, string> = new Map;

	constructor(
		readonly compiler: Compiler,
		readonly config: Config,
		readonly configURI: ReadonlyURI,
	) {
		this.program = new mil.Program({
			initializer: config.initializer,
			destructor: config.destructor,
			mainScoreboard: config.scoreboardNamespace + "m",
			mainNBTStorage: config.nbtStorageNamespace + "main",
			floatResolution: 300,
			doubleResolution: 300,
		});
	}

	createUniqueName(preferredName: string) {
		let i = 0, name = preferredName;
		while (this.temporaries.has(name)) name = `${preferredName}${i++}`;
		this.temporaries.add(name);
		return name;
	}

	suggestBranchName(name: string): string {
		const namespacedId = "_"+this.config.functionNamespace + name;
		let i = 0, suggestion = namespacedId;
		while (this.program.branches.has(suggestion)) suggestion = `${namespacedId}${i++}`;
		return suggestion;
	}
	
	async importModule(uri: ReadonlyURI, branchName: string): Promise<Module> {
		this.compiler.console.log(`Importing EMCL module: ${this.compiler.uri.relativePathOf(uri)}`);

		if (this.modules.has(uri.toString())) return this.modules.get(uri.toString())!;

		const source = await this.compiler.fileSystem.readTextFile(uri);
		const fileName = this.compiler.uri.relativePathOf(uri);
		const parseResult = parserPipeline.pipeline(source, fileName);

		const module: Module = {
			parseResult, 
			ast: parseResult.ast || new VoidValue,
			exports: new Map,
		}

		this.modules.set(uri.toString(), module);
		for (const callback of this.compiler.onImportModule) callback.call(this.compiler, this, uri);

		let lastError: Error;
		for (const error of parseResult.lexicalErrors) lastError = error, this.compiler.console.error(error.message);
		for (const error of parseResult.syntaxError) lastError = error, this.compiler.console.error(error.message);
		for (const error of parseResult.treeBuilderError) lastError = error, this.compiler.console.error(error.message);
		if (!parseResult.ast) throw lastError! ?? new Error(`Unknown Error while importing module: ${uri.toString()}.`);
		
		await module.ast.compile(new Context(this, uri.clone(), branchName, new SymbolTable));

		return module;
	}

	extraFiles() {
		const out: Map<string, string> = new Map;
		const toJSON = (data: any)=>JSON.stringify(data, null, "\t");
		
		if (this.config.onLoad) out.set("data/minecraft/tags/functions/load.json", toJSON({
			replace: false,
			values: this.config.onLoad
		}));

		if (this.config.onTick) out.set("data/minecraft/tags/functions/tick.json", toJSON({
			replace: false,
			values: this.config.onTick
		}));

		if (this.config.packMeta) out.set("pack.mcmeta", toJSON(this.config.packMeta));

		return out;
	}
}

export class Context {
	constructor(
		public compilation: Compilation, 
		readonly moduleURI: ReadonlyURI,
		public branchName: string, 
		public symbolTable: SymbolTable<string, Value>
	) { 
		this.compilation.program.branches.set(this.branchName, [])
	}

	currentModule() {
		return this.compilation.modules.get(this.moduleURI.toString())!;
	}

	appendCommand(command: mil.InstructionLike) {
		this.compilation.program.branches.get(this.branchName)!.push(command);
	}

	semanticError(message: string) {
		return this.compilation.compiler.logError(new SemanticError(message));
	}
}

export class SemanticError extends Error {
	constructor(message: string) { super(message); }
}

export class IOError extends Error {
	constructor(message: string) { super(message); }
}

export interface Console {
	log(text: string): any;
	warn(text: string): any;
	error(text: string): any;
}