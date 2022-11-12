import * as app from "../../app.js";
import { CodeViewer } from "../components/CodeViewer.js";
import * as collapsiblePanel from "../components/collapsiblePanel.js";
import { lexer } from "emcl";

export const root = document.createElement("div");
root.style.overflow = "auto";

app.compiler.beforeCompile.add(()=>{
	root.textContent = "";
});

app.compiler.onLoadConfig.add((compilation)=>{
	const code = new CodeViewer("emcl", lexer);
	code.setText(JSON.stringify(compilation.config, null, "\t"));
	
	root.append(collapsiblePanel.create(app.compiler.uri.relativePathOf(compilation.configURI), code.root));
});

app.compiler.onImportModule.add((compilation, uri)=>{
	const module = compilation.modules.get(uri.toString())!;

	const code = new CodeViewer("emcl", lexer);
	code.setTokens(module.parseResult.tokens, module.parseResult.tokenMap);

	for (const error of module.parseResult.lexicalErrors) code.highlightError(error.tokenIndex);
	for (const error of module.parseResult.syntaxError) code.highlightError(error.tokenIndex);

	root.append(collapsiblePanel.create(app.compiler.uri.relativePathOf(uri), code.root));
})