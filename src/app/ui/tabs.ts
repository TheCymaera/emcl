import * as app from "../app";
import * as infoPage from "./pages/info";
import * as sourcePage from "./pages/sources";
import * as outputPage from "./pages/output";

const panels = [
	infoPage.element,
	app.console.root,
	sourcePage.root,
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