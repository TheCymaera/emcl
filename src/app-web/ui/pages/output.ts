import * as app from "../../app.js";
import * as collapsiblePanel from "../components/collapsiblePanel.js";
import { CodeViewer } from "../components/CodeViewer.js";

export const element = document.createElement("div");
element.style.overflow = "auto";

app.compiler.onGenerateCode.add((compilation)=>{
	element.textContent = "";
	for (const [path, text] of compilation.files) {
		const code = new CodeViewer("text");
		code.setText(text);

		element.append(collapsiblePanel.create(path, code.root));
	}
});