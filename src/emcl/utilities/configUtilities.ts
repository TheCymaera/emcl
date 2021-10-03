import { ReadonlyURI, URI } from "../../file-system/URI.js";
import { validateNamespacedId, validateScoreboardObjective, maxScoreboardObjectiveLength } from "../../mil/linter/linter.js";
import type { Config, Console } from "../Compiler.js";

export function boilerplate(name: string): Config {
	return {
		entry: "main.emcl",
		destination: "dst",
		
		initializer: `${name}:init`,
		destructor: `${name}:destroy`,
		scoreboardNamespace: `${name}.i`,
		functionNamespace: `${name}:internal/`,
		
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

export function projectFromConfig(config: Config) {
	const out: Map<string, string|undefined> = new Map;
	out.set("emcl.config.json", JSON.stringify(config, null, "\t"));
	out.set(config.entry, "");
	if (config.destination) out.set(config.destination, undefined);
	return out;
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
		const issue = validateNamespacedId(config.initializer);
		if (issue) console.warn(issue);
	}

	if (!config.destructor) {
		console.error(`"config.destructor" must not be empty.`);
	} else if (typeof config.destructor !== "string") {
		console.error(`"config.destructor" must be a string.`);
	} else {
		const issue = validateNamespacedId(config.destructor);
		if (issue) console.warn(issue);
	}
	
	if (!config.scoreboardNamespace) {
		console.error(`"config.scoreboardNamespace" must not be empty.`);
	} else if (typeof config.scoreboardNamespace !== "string") {
		console.error(`"config.scoreboardNamespace" must be a string.`);
	} else {
		const issue = validateScoreboardObjective(config.scoreboardNamespace);
		if (issue) console.warn(issue);

		const maxLength = maxScoreboardObjectiveLength - 3;
		if (config.scoreboardNamespace.length > maxLength) {
			console.warn(`"config.scoreboardNamespace" should be kept under ${maxLength} characters.`);
		}
	}
	
	if (!config.functionNamespace) {
		console.error(`"config.functionNamespace" must not be empty.`);
	} else if (typeof config.functionNamespace !== "string") {
		console.error(`"config.functionNamespace" must be a string.`);
	} else {
		const issue = validateNamespacedId(config.functionNamespace);
		if (issue) console.warn(issue);
	}

	function validateTag(key: string, tag: any) {
		if (tag === undefined) return;
		if (tag instanceof Array) {
			for (const item of tag) {
				const issue = validateNamespacedId(`${item}`);
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
