import { Config } from "../compilation/Config.js";
import { type Console } from "../compilation/Compiler.js";
import { FileSystem, type ReadonlyURI } from "file-system";

export class ProjectGenerator {
	// TODO: Replace this
	console!: Console;
	fileSystem!: FileSystem;
	uri!: ReadonlyURI;

	async generate(config?: Config) {
		if (!this.uri) return this.console.error(`No project loaded.`);
		this.console.log(`Input Directory: ${this.uri.toString()}`);

		if (!config) {
			const projectName = this.uri.slug().trim().split(/\s+|(?=[A-Z])/).join('_').toLowerCase();
			config = Config.boilerplate(projectName);
		}

		const files = ProjectGenerator.files(config);

		try {
			for (const [path, content] of files) {
				const fileURI = this.uri.clone().appendString(path);
				if (content !== undefined) {
					await this.fileSystem.readTextFile(fileURI).catch(async ()=>{
						this.console.log(`Creating file: ${fileURI}`);
						await this.fileSystem.writeTextFile(fileURI, content);
					});
				} else {
					this.console.log(`Creating directory: ${fileURI}`);
					await this.fileSystem.createDirectory(fileURI);
				}
			}
			this.console.log(`Complete!`);
		} catch(e) {
			this.console.error(`Unexpected error:\n` + (e instanceof Error ? e.message : e));
			throw e;
		}
	}

	static files(config: Config) {
		const out: Map<string, string|undefined> = new Map;
		out.set("emcl.config.json", JSON.stringify(config, null, "\t"));
		out.set(config.entry, "");
		if (config.destination) out.set(config.destination, undefined);
		return out;
	}
}