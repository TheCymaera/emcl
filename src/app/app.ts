import { Compiler } from "../emcl/Compiler.js";
import { AggregateFileSystem } from "../file-system/AggregateFileSystem.js";
import { FetchFileSystem } from "../file-system/FetchFileSystem.js";
import { FSAFileSystem } from "../file-system/FSAFileSystem.js";
import { ReadonlyURI } from "../file-system/URI.js";
import { Console } from "../vendor/hadron/widgets/menus/Console.js";

export const console = new Console;

export const fileSystem = new AggregateFileSystem;
export const fsaFileSystem = new FSAFileSystem;
fsaFileSystem.onRegisterHandle.add(({uri})=>window.console.log(`Registered handle at ${uri}`));

fileSystem.schemes.set(fsaFileSystem.scheme = "fsa", fsaFileSystem);

const fetchFileSystem = new FetchFileSystem;
fileSystem.schemes.set("http", fetchFileSystem);
fileSystem.schemes.set("https", fetchFileSystem);

export const onLoadProject: Set<(uri: ReadonlyURI)=>any> = new Set;
export function loadProject(uri: ReadonlyURI) {
	compiler.uri = uri;
	window.console.log(`Loaded project: ${uri.toString()}`);
	for (const callback of onLoadProject) callback(uri);
}

export const compiler = new Compiler();
compiler.console = console;
compiler.fileSystem = fileSystem;

export async function openLoadFSAProjectDialog() {
	if (!window["showDirectoryPicker"]) {
		alert(fsaNoSupportMessage);
		return;
	}

	const handle = await showDirectoryPicker().catch(()=>undefined);
	if (!handle) return;
	const uri = 
		await fsaFileSystem.getURI(handle) ||
		fsaFileSystem.registerHandle(fsaFileSystem.availableAuthority(handle.name), handle);
		
	loadProject(uri);
}

export async function compile() {
	console.clear();
	openTab(1);
	await compiler.compile();
}


export const onOpenTab: Set<(index: number)=>any> = new Set;
export function openTab(index: number) {
	for (const callback of onOpenTab) callback(index);
}

const fsaNoSupportMessage = "The File System Access API is not supported in this browser. Consider switching to a Chromium browser like Google Chrome, Opera, or Microsoft Edge.";
if (!window["showDirectoryPicker"]) alert(fsaNoSupportMessage);