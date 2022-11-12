import * as app from "../app.js";
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