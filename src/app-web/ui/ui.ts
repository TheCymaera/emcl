import * as app from "../app.js";
import { fa5_solid_info, fa5_solid_newspaper, fa5_solid_download, fa5_solid_folder, fa5_solid_play } from "fontawesome-svgs";

document.body.innerHTML = /*html*/`
<div class="tabs flex h-10 bg-surfaceContainer text-onSurfaceContainer">
	<button class="${buttonVariants.inkWell} grid place-items-center w-10">${fa5_solid_info}</i></button>
	<button class="${buttonVariants.inkWell} grid place-items-center w-10">${fa5_solid_newspaper}</i></button>
	<button class="${buttonVariants.inkWell} grid place-items-center flex-1"><b>Console</b></button>
	<button class="${buttonVariants.inkWell} grid place-items-center flex-1"><b>Sources</b></button>
	<button class="${buttonVariants.inkWell} grid place-items-center flex-1"><b>Optimizer</b></button>
	<button class="${buttonVariants.inkWell} grid place-items-center flex-1"><b>Output</b></button>
</div>
<div id="panelContainer" class="relative [&>*]:absolute [&>*]:inset-0"></div>
<div class="flex h-10 bg-surfaceContainer text-onSurfaceContainer">
	<div class="${buttonVariants.inkWell} grid place-items-center w-10" id="install"    title="Install">${fa5_solid_download}</div>
	
	<span class="flex-1"></span>

	<div class="${buttonVariants.inkWell} grid place-items-center w-10" id="loadProject" title="Load Project">${fa5_solid_folder}</div>
	<div class="${buttonVariants.inkWell} grid place-items-center w-10" id="compile" title="Compile">${fa5_solid_play}</div>
</div>
`

// Bottom Bar
const loadProject = document.querySelector("#loadProject") as HTMLElement;
const compile = document.querySelector("#compile") as HTMLElement;

loadProject.onclick = ()=>app.openLoadFSAProjectDialog();
compile.onclick = ()=>app.compile();

const install = document.querySelector("#install") as HTMLElement;
window.addEventListener("beforeinstallprompt", (event: any)=>{
	// hide default prompt
	event.preventDefault();

	// attach prompt to button
	install.style.display = "";
	install.onclick = async ()=>{
		event.prompt();
		await event.userChoice;
		install.style.display = "none";
	}
});

// Tabs
import * as infoPage from "./pages/info.js";
import * as newsPage from "./pages/news.js";
import * as sourcePage from "./pages/sources.js";
import * as optimizerPage from "./pages/optimizer.js";
import * as outputPage from "./pages/output.js";
import { buttonVariants } from "./buttonVariants.js";

const panels = [
	infoPage.element,
	newsPage.element,
	app.console.root,
	sourcePage.root,
	optimizerPage.element,
	outputPage.element,
];

const tabs = document.querySelector(".tabs")!.children as HTMLCollectionOf<HTMLElement>;
const panelContainer = document.querySelector("#panelContainer")!;

for (let i = 0; i < tabs.length; i++) {
	tabs[i]!.onclick = ()=>app.openTab(i);
}

app.onOpenTab.add((index: number)=>{
	for (const tab of tabs) tab.toggleAttribute("data-on", tab === tabs[index]);
	panelContainer.innerHTML = "";
	panelContainer.appendChild(panels[index]!);
});

app.openTab(0);