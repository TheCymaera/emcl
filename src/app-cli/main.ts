#!/usr/bin/env node
import { AggregateFileSystem, NodeFileSystem, URI } from "file-system";
import { Compiler, ProjectGenerator } from "emcl";

const workingDir = new URI("file").appendString(process.cwd() + "/")!;

const fileSystem = new AggregateFileSystem;
fileSystem.schemes.set("file", new NodeFileSystem);

(async ()=>{
	const args = process.argv.slice(2);
	const separator = "=========================";

	console.log(separator);
	switch (args[0]) {
		case "init": {
			const projectGenerator = new ProjectGenerator();
			projectGenerator.console = console;
			projectGenerator.fileSystem = fileSystem;
			projectGenerator.uri = workingDir;
			await projectGenerator.generate();
			break;
		}

		case "build": {
			const compiler = new Compiler();
			compiler.console = console;
			compiler.fileSystem = fileSystem;
			compiler.uri = workingDir;
			await compiler.compile();
			break;
		}

		default: {
			console.log("Usage:\n > emcl init|build");
			break;
		}
	}


	console.log(separator);
})();