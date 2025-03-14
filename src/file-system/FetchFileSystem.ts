import { FileSystem } from "./FileSystem.js";
import { type ReadonlyURI } from "./URI.js";

export class FetchFileSystem extends FileSystem {
	async readTextFile(uri: ReadonlyURI) {
		const response = await fetch(uri.toString(), {cache: "reload"});
		if (response.status === 404) throw new Error(`File "${uri.slug()}" not found.`);
		return await response.text();
	}

	async writeTextFile() {
		throw new Error("Failed to write file:\nFile system is read only.");
	}

	async createDirectory() {
		throw new Error("Failed to create directory:\nFile system is read only.");
	}

}