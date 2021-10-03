import { Program } from "../../../mil/mil.js";
import * as app from "../../app.js";
import { EMCLCode } from "../components/EMCLCode.js";

export const element = document.createElement("div");
Object.assign(element.style, {
	display: "grid",
	gridTemplateColumns: "var(--navigation-rail-width) auto",
	overflow: "hidden",
});

element.innerHTML = /*html*/`
	<navigation-rail>
		<div class="center-content"><i class="fa fa-file"  			title="Files"></i></div>
		<div class="center-content"><i class="fa fa-microchip"  	title="MIL"></i></div>
		<div class="center-content"><i class="fa fa-bolt"  			title="Optimized MIL"></i></div>
	</navigation-rail>
	<div class="expand-children"></div>
`;

const panels = [
	document.createElement("div"),
	document.createElement("div"),
	document.createElement("div"),
];

for (const panel of panels) panel.style.overflow = "auto";

const tabs = element.children[0]!.children as HTMLCollectionOf<HTMLElement>;
const panelContainer = element.children[1] as HTMLElement;
for (let i = 0; i < tabs.length; i++) {
	tabs[i]!.onclick = ()=>openTab(i);
}
openTab(0);

function openTab(index: number) {
	panelContainer.textContent = "";
	panelContainer.append(panels[index]!);
	for (const tab of tabs) tab.classList.toggle("selected", tab === tabs[index]);
}

function renderProgram(element: HTMLElement, program: Program) {
	element.textContent = "";

	for (const [name, block] of [...program.blocks].reverse()) {
		const details = document.createElement("details");
		details.classList.add("app-collapsible-panel");
		const summary = document.createElement("summary");
		summary.textContent = name;
		const code = new EMCLCode;
		code.setText(block.map(i=>i.serialize()).join("\n"));
		details.append(summary, code.root);
		details.open = true;

		element.append(details);
	}
}




app.compiler.onCompile.add((program)=>renderProgram(panels[1]!, program));
app.compiler.onTransform.add((program)=>renderProgram(panels[2]!, program));
app.compiler.onGenerateCode.add((files)=>{
	const element = panels[0]!;
	element.textContent = "";
	for (const [path, text] of [...files].sort()) {
		const details = document.createElement("details");
		details.classList.add("app-collapsible-panel");
		const summary = document.createElement("summary");
		summary.textContent = path;
		const code = document.createElement("code-block");
		code.style.whiteSpace = "pre";
		code.textContent = text;
		details.append(summary, code);
		details.open = true;

		element.append(details);
	}
});