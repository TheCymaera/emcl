import { EMCLCode } from "../components/EMCLCode.js";

export const element = document.createElement("div");
element.style.padding = "1em";
element.style.overflow = "auto";

const container = document.createElement("div");
container.style.margin = "auto";
container.style.width = "800px";
element.append(container);

(async ()=>{
	const response = await fetch("./assets/info.html");
	container.innerHTML = await response.text();
	for (const element of container.querySelectorAll("code-block.emcl")) {
		element.replaceWith(new EMCLCode().setText(element.textContent ?? "").root);
	}
})();