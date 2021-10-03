import * as app from "./app";
window["app"] = app;
console.log(`For debugging, see "window.app"`);

import "./ui/tabs";
import "./ui/bottomBar";
import "./ui/autoCreateProject";
import { URI } from "../file-system/URI.js";


function updateHash() {
	const hash = new URLSearchParams(location.hash.substr(1));
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
		app.openTab(2);
	}
}

addEventListener("hashchange",()=>updateHash());
updateHash();