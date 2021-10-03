import * as app from "../../app.js";
import { EMCLCode } from "../components/EMCLCode.js";

export const root = document.createElement("div");
root.style.overflow = "auto";

app.compiler.beforeCompile.add(()=>{
	root.textContent = "";
});

app.compiler.onLoadConfig.add((uri, config)=>{
	const details = document.createElement("details");
	details.classList.add("app-collapsible-panel");
	const summary = document.createElement("summary");
	summary.textContent = app.compiler.uri.relativePathOf(uri);
	const code = document.createElement("code-block");
	code.style.whiteSpace = "pre";
	code.textContent = JSON.stringify(config, null, "\t");
	details.append(summary, code);
	details.open = true;
	root.append(details);
});

app.compiler.onImportModule.add((uri, module)=>{
	const details = document.createElement("details");
	details.classList.add("app-collapsible-panel");
	const summary = document.createElement("summary");
	summary.textContent = app.compiler.uri.relativePathOf(uri);
	const code = new EMCLCode;
	code.setTokens(module.tokens, module.tokenMap);
	details.append(summary, code.root);
	details.open = true;
	root.append(details);
})