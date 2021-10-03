import * as app from "../app";

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