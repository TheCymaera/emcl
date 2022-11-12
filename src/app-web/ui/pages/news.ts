import { CodeViewer } from "../components/CodeViewer.js";
import { lexer } from "emcl";

export const element = document.createElement("div");
element.style.padding = "1em";
element.style.overflow = "auto";

const container = document.createElement("div");
container.style.margin = "auto";
container.style.maxWidth = "800px";
element.append(container);

(async ()=>{
	const response = await fetch("./assets/news.html");
	container.innerHTML = await response.text();
	for (const element of container.querySelectorAll("code-block.emcl")) {
		element.replaceWith(new CodeViewer("emcl", lexer).setText(element.textContent ?? "").root);
	}
})();