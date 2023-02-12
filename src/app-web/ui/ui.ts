import * as app from "../app.js";
import { fa5_solid_info, fa5_solid_newspaper, fa5_solid_download, fa5_solid_folder, fa5_solid_play } from "fontawesome-svgs";

document.body.innerHTML = /*html*/`
<tabs->
	<div class="center-content square">${fa5_solid_info}</i></div>
	<div class="center-content square">${fa5_solid_newspaper}</i></div>
	<div class="center-content"><b>Console</b></div>
	<div class="center-content"><b>Sources</b></div>
	<div class="center-content"><b>Optimizer</b></div>
	<div class="center-content"><b>Output</b></div>
</tabs->
<backdrop- id="panelContainer" class="expand-children"></backdrop->
<bottom-navigation-bar>
<div 
	id="install" 
	class="center-content square" 
	title="Install" 
	style="display: none"
>${fa5_solid_download}</div>
<bottom-navigation-bar-buffer></bottom-navigation-bar-buffer>
<div 
	id="loadProject" 
	class="center-content square" 
	title="Load Project"
>${fa5_solid_folder}</div>
<div 
	id="compile" 
	class="center-content square"  
	title="Compile"
>${fa5_solid_play}</div>
</bottom-navigation-bar>
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

const panels = [
	infoPage.element,
	newsPage.element,
	app.console.root,
	sourcePage.root,
	optimizerPage.element,
	outputPage.element,
];

const tabs = document.querySelector("tabs-")!.children as HTMLCollectionOf<HTMLElement>;
const panelContainer = document.querySelector("#panelContainer")!;

for (let i = 0; i < tabs.length; i++) {
	tabs[i]!.onclick = ()=>app.openTab(i);
}

app.onOpenTab.add((index: number)=>{
	for (const tab of tabs) tab.classList.toggle("selected", tab === tabs[index]);
	panelContainer.innerHTML = "";
	panelContainer.appendChild(panels[index]!);
});

app.openTab(0);