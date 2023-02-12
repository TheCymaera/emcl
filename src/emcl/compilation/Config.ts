import * as linter from "../linter/index.js";
import { ReadonlyURI, URI } from "file-system";
import { Console } from "./Compiler.js";

export interface Config {
	entry: string;
	destination?: string;
	
	initializer: string;
	destructor: string;
	scoreboardNamespace: string;
	nbtStorageNamespace: string;
	functionNamespace: string;
	
	onLoad?: string[];
	onTick?: string[];
	packMeta?: any;
}

export namespace Config {
	export interface ParseResult {
		error?: string;
		config?: Config;
	}

	export function parse(text: string): ParseResult {
		try {
			return {
				config: JSON.parse(text)
			}
		} catch(e) {
			return {
				error: "Config file is malformed."
			}
		}
	}

	export function boilerplate(projectName: string): Config {
		return {
			entry: "main.emcl",
			destination: "dst",
			
			initializer: `${projectName}:init`,
			destructor: `${projectName}:destroy`,
			scoreboardNamespace: `${projectName}.i`,
			functionNamespace: `${projectName}:internal/`,
			nbtStorageNamespace: `${projectName}:internal/`,
			
			onLoad: [],
			onTick: [],
			packMeta: {
				"pack": {
					"pack_format": 7,
					"description": "<ADD DESCRIPTION HERE>"
				}
			}
		}
	}

	export function validate(config: any, uri: ReadonlyURI, console: Console) {
		if (!config) console.error("Config must not be empty!");

		if (!config.entry) {
			console.error(`"config.entry" must not be empty.`);
		} else if (!URI.fromString(uri.toString() + `${config.entry}`)) {
			console.error(`"config.entry" is malformed!`);
		}

		if (config.destination && !URI.fromString(uri.toString() + `${config.destination}`)) {
			console.error(`"config.destination" is malformed!`);
		}

		if (!config.initializer) {
			console.error(`"config.initializer" must not be empty.`);
		} else if (typeof config.initializer !== "string") {
			console.error(`"config.initializer" must be a string.`);
		} else {
			const issue = linter.namespacedId.lint(config.initializer);
			if (issue) console.warn(issue);
		}

		if (!config.destructor) {
			console.error(`"config.destructor" must not be empty.`);
		} else if (typeof config.destructor !== "string") {
			console.error(`"config.destructor" must be a string.`);
		} else {
			const issue = linter.namespacedId.lint(config.destructor);
			if (issue) console.warn(issue);
		}
		
		if (!config.scoreboardNamespace) {
			console.error(`"config.scoreboardNamespace" must not be empty.`);
		} else if (typeof config.scoreboardNamespace !== "string") {
			console.error(`"config.scoreboardNamespace" must be a string.`);
		} else {
			const issue = linter.scoreboard.lintObjective(config.scoreboardNamespace);
			if (issue) console.warn(issue);

			const maxLength = linter.scoreboard.maxObjectiveLength - 3;
			if (config.scoreboardNamespace.length > maxLength) {
				console.warn(`"config.scoreboardNamespace" should be kept under ${maxLength} characters.`);
			}
		}
		
		if (!config.functionNamespace) {
			console.error(`"config.functionNamespace" must not be empty.`);
		} else if (typeof config.functionNamespace !== "string") {
			console.error(`"config.functionNamespace" must be a string.`);
		} else {
			const issue = linter.namespacedId.lint(config.functionNamespace);
			if (issue) console.warn(issue);
		}
		
		if (!config.nbtStorageNamespace) {
			console.error(`"config.nbtStorageNamespace" must not be empty.`);
		} else if (typeof config.nbtStorageNamespace !== "string") {
			console.error(`"config.nbtStorageNamespace" must be a string.`);
		} else {
			const issue = linter.namespacedId.lint(config.nbtStorageNamespace);
			if (issue) console.warn(issue);
		}

		function validateTag(key: string, tag: any) {
			if (tag === undefined) return;
			if (tag instanceof Array) {
				for (const item of tag) {
					const issue = linter.namespacedId.lint(`${item}`);
					if (issue) console.warn(issue);
				}
				return;
			}
			console.warn(`"${key}" must be string[] or undefined.`);
		}
		
		validateTag("config.onLoad", config.onLoad);
		validateTag("config.onTick", config.onTick);

		const boilerPlate = boilerplate("boilerplate");
		for (const property of Object.keys(config)) {
			if (!(property in boilerPlate)) {
				console.warn(`"config.${property}" is not a known option.`);
			}
		}
	}
}