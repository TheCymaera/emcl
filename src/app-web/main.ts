import * as app from "./app.js";
import "./main.css";
window["app"] = app;
console.log(`For debugging, see "window.app" and "window.compilation"`);

app.compiler.onLoadConfig.add((compilation)=>window["compilation"] = compilation);

app.onLoadProject.add((uri)=>{
	app.openTab(2);
	app.console.clear();
	app.console.log(`Loaded project: ${uri.toString()}`);

	const configURI = uri.clone().appendString("emcl.config.json");
	app.fileSystem.readTextFile(configURI).catch(async ()=>{
		if (!confirm(`A config file was not found. Would you like to create one?`)) return;
		app.console.clear();
		app.projectGenerator.generate();
	});
});

import "./ui/ui.js";

import { URI } from "../file-system/URI.js";

function onHashChange() {
	const hash = new URLSearchParams(location.hash.substring(1));

	// load config
	const sourceURL = hash.get("source-url");
	if (sourceURL) {
		const uri = new URI;
		try {
			uri.setString(location.href);
			uri.appendString(sourceURL);
		} catch(e) {
			console.log(`Source URI provided by URL fragment is malformed.`);
			return;
		}

		app.loadProject(uri);
		app.compile();
		app.openTab(3);
	}
}

addEventListener("hashchange",()=>onHashChange());
onHashChange();