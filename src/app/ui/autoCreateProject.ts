import * as app from "../app.js";
import * as configUtilities from "../../emcl/utilities/configUtilities.js";

app.onLoadProject.add((uri)=>{
	const configURI = uri.clone().appendString("emcl.config.json");
	app.fileSystem.readTextFile(configURI).catch(async ()=>{
		if (!confirm(`A config file was not found. Would you like to create one?`)) return;

		app.console.clear();
		app.openTab(1);

		const projectName = uri.slug().trim().split(/\s+|(?=[A-Z])/).join('_').toLowerCase();
		const files = configUtilities.projectFromConfig(configUtilities.boilerplate(projectName));
		for (const [path, content] of files) {
			const fileURI = uri.clone().appendString(path);
			if (content !== undefined) {
				await app.fileSystem.readFile(fileURI).catch(async ()=>{
					await app.fileSystem.writeTextFile(fileURI, content);
					app.console.log(`Created file: ${path}`);
				});
			} else {
				await app.fileSystem.createDirectory(fileURI);
				app.console.log(`Created directory: ${path}`);
			}
		}
	});
})