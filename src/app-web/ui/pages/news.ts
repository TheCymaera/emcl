import { CodeViewer } from "../components/CodeViewer.js";
import { lexer } from "emcl";
import html from "./news.html?raw";

export const element = document.createElement("div");
element.style.padding = "1em";
element.style.overflow = "auto";

const container = document.createElement("div");
container.style.margin = "auto";
container.style.maxWidth = "800px";
element.append(container);

container.innerHTML = html;
for (const element of container.querySelectorAll("code-block.emcl")) {
	element.replaceWith(new CodeViewer("emcl", lexer).setText(element.textContent ?? "").root);
}