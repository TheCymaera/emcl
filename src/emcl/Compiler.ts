import { ASTNode, Value } from "./ast/astNode";
import { FileSystem } from "../file-system/FileSystem";
import { ReadonlyURI } from "../file-system/URI.js";
import { pipeline as parserPipeline } from "./grammar/pipeline";
import { Lexer } from "../compiler-builder/Lexer.js";
import * as mil from "../mil/mil.js";
import * as optimizer from "../mil/optimizer/optimizer.js";
import * as linter from "../mil/linter/linter.js";
import * as configUtils from "./utilities/configUtilities.js";

export class Compiler {
	fileSystem: FileSystem;
	console: Console;
	uri: ReadonlyURI;
	
	config: Config;
	modules: Map<string, Module>;
	program: mil.Program;

	readonly beforeCompile: Set<(this: this)=>any> = new Set;
	readonly onLoadConfig: Set<(this: this, uri: ReadonlyURI, config: Config)=>any> = new Set;
	readonly onImportModule: Set<(this: this, uri: ReadonlyURI, module: Module)=>any> = new Set;
	readonly onCompile: Set<(this: this, program: mil.Program)=>any> = new Set;
	readonly onTransform: Set<(this: this, program: mil.Program)=>any> = new Set;
	readonly onGenerateCode: Set<(this: this, files: Map<string, string>)=>any> = new Set;

	clear() {
		this.modules = new Map;
		this.program = new mil.Program;
	}

	async compile() {
		try {
			for (const callback of this.beforeCompile) callback.call(this);

			if (!this.uri) {
				const message = `No project loaded.`;
				this.console.error(message);
				throw new IOError(message);
			}

			this.clear();
			this.console.log(`Compiling project: ${this.uri}`);

			// load and validate config
			await this._loadConfig();
			configUtils.validate(this.config, this.uri, this.console);

			// compile program
			this.program.config = this.config;
			await Context.entry(this);
			this.console.log("Compilation successful!");
			for (const callback of this.onCompile) callback.call(this, this.program);

			// optimize program
			const optimized = optimizer.optimize(this.program);
			this.console.log("Code optimization successful!");
			for (const callback of this.onTransform) callback.call(this, optimized);
			
			// generate code
			// add extra files to output (tags & pack.mcmeta)
			const generator = optimized.generate();
			this.console.log("Code generation successful!");
			const files = generator.files();
			this._extraFiles(files);
			for (const callback of this.onGenerateCode) callback.call(this, files);
			
			// lint scores
			for (const score of generator.scores) {
				const issue = linter.validateScoreboardObjective(score.objective);
				if (issue) this.console.warn(issue);
			}

			// lint namespaced-ids
			for (const [id] of generator.mcfunctions) {
				const issue = linter.validateNamespacedId(id);
				if (issue) this.console.warn(issue);
			}

			// write files
			if (this.config.destination) {
				const destinationRoot = this.uri.clone().appendString(this.config.destination, true);
				for (const [path, content] of files) {
					const uri = destinationRoot.clone().appendString(path);

					this.console.log(`Writing file: ${path}`);
					await this.fileSystem.writeTextFile(uri, content).catch((e)=>{
						const message = e.message;
						this.console.error(message);
						throw new IOError(message);
					});
				}
				this.console.log(`Created all files successfully.`);
			} else {
				this.console.warn(`No files were created as "config.destination" was not specified.`);
			}
		} catch(e) {
			// log and throw if it is an unexpected error.
			let unexpectedError = true;
			if (e instanceof SemanticError) unexpectedError = false;
			if (e instanceof IOError) unexpectedError = false;
			if (unexpectedError) this.console.error(`Unexpected Error.`);
			this.console.error(`Compilation Failed!`);
			throw e;
		}
	}

	private async _loadConfig() {
		const uri = this.uri.clone().setFilename("emcl.config.json");

		this.console.log(`Reading config file: ${this.uri.relativePathOf(uri)}`);
		const text = await this.fileSystem.readTextFile(uri).catch(e=>{
			this.console.error(e.message);
			throw new IOError(e.message);
		});;
		
		try {
			this.config = JSON.parse(text);
		} catch(e) {
			window.console.log(`Failed to load config file:`, text);
			this.console.error(`Config file is malformed!`);
			throw new IOError(`Config file is malformed!`);
		}

		for (const callback of this.onLoadConfig) callback.call(this, uri, this.config);
	}

	private async _extraFiles(out: Map<string, string> = new Map) {
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
	static async entry(compiler: Compiler) {
		const entryURI = compiler.uri.clone().appendString(compiler.config.entry);

		const ctx =  new Context(compiler, entryURI, [], [new Map], new Set);
		await ctx.importModule(entryURI);
		ctx._appendToFunction(compiler.config.initializer, ctx.out);
	}

	private constructor(
		public compiler: Compiler,
		public moduleURI: ReadonlyURI,
		public out: mil.Instruction[],
		private readonly _symbolTable: Map<string, Value>[],
		private readonly _temporaries: Set<string>,
	) { }

	async importModule(uri: ReadonlyURI): Promise<void> {
		const uriString = uri.toString();

		// return module if already imported
		let module = this.compiler.modules.get(uriString);
		if (module) return;

		// read file
		this.compiler.console.log(`Reading file: ${this.moduleURI.relativePathOf(uri)}`);
		const text = await this.compiler.fileSystem.readTextFile(uri).catch(e=>{
			throw this.semanticError(e.message);
		});
		
		// parse file
		const ctx = new Context(this.compiler, uri, this.out, [new Map], this._temporaries);
		module = parserPipeline(ctx, text) as Module;
		this.compiler.modules.set(uriString, module);
		for (const callback of this.compiler.onImportModule) callback.call(this, uri, module);

		// compile module with new context
		await module.ast.compile(ctx);
	}

	async compileToNamelessFunction(ast: ASTNode) {
		const name = `_branch${this.compiler.program.blocks.size}`;
		await this.compileToFunction(name, ast);
		return name;
	}

	async compileToFunction(name: string, ast: ASTNode) {
		const ctx = new Context(
			this.compiler, 
			this.moduleURI, 
			[],
			this._symbolTable,
			this._temporaries,
		);
		this._appendToFunction(name, []);
		await ast.compile(ctx);
		this._appendToFunction(name, ctx.out);
	}

	createTemporary(preferredName = "T") {
		let i = 0, name = preferredName;
		while (this._temporaries.has(name)) name = `${preferredName}${i++}`;
		this._temporaries.add(name);
		return new mil.NumberVariable(name);
	}

	defineIdentifier(identifier: string, value: Value) {
		const scope = this._symbolTable[this._symbolTable.length-1]!
		if (scope.has(identifier)) throw this.semanticError(`"${identifier}" is already declared in this scope!`);
		scope.set(identifier, value);
	}

	resolveIdentifier(identifier: string) {
		for (let i = this._symbolTable.length-1; i >= 0; i--) {
			const scope = this._symbolTable[i]!;
			if (scope.has(identifier)) return scope.get(identifier)!;
		}
		throw this.semanticError(`"${identifier}" is not declared!`);
	}

	enterScope() {
		this._symbolTable.push(new Map);
	}

	exitScope() {
		if (!this._symbolTable.length) throw new Error(`Tried to exit the global scope.`);
		this._symbolTable.pop();
	}

	isGlobal() {
		return this._symbolTable.length === 1;
	}

	semanticError(message: string) {
		this.compiler.console.error(message);
		return new SemanticError(message);
	}

	private _appendToFunction(name: string, commands: mil.Instruction[]) {
		const block = this.compiler.program.blocks.get(name) || [];
		block.push(...commands);
		this.compiler.program.blocks.set(name, block);
	}
}

export interface Module {
	source: string,
	tokens: Lexer.Token[];
	tokenMap: WeakMap<Lexer.Token, Lexer.TokenMapItem>;
	ast: ASTNode;
	syntaxError?: SyntaxErrorInfo;
}

export class SemanticError extends Error { }
export class IOError extends Error { }

export interface SyntaxErrorInfo {
	message: string;
	tokenIndex: number;
}

export interface Config extends mil.Config {
	entry: string;
	destination?: string;
	
	initializer: string;
	destructor: string;
	scoreboardNamespace: string;
	functionNamespace: string;
	
	onLoad?: string[];
	onTick?: string[];
	packMeta?: any;
}

export interface Console {
	log(text: string): any;
	warn(text: string): any;
	error(text: string): any;
}