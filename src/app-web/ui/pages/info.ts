import { CodeViewer } from "../components/CodeViewer.js";
import { lexer } from "emcl";
import { fa5_brands_youtube } from "fontawesome-svgs";
// @ts-expect-error
import html from "./info.html";

export const element = document.createElement("div");
element.style.padding = "1em";
element.style.overflow = "auto";

const container = document.createElement("div");
container.style.margin = "auto";
container.style.maxWidth = "800px";
element.append(container);

container.innerHTML = html.replaceAll("<!--fa-youtube-->", fa5_brands_youtube);
for (const element of container.querySelectorAll("code-block.emcl")) {
	element.replaceWith(new CodeViewer("emcl", lexer).setText(element.textContent ?? "").root);
}