import { FileSystem } from "./FileSystem.js";
import { ReadonlyURI, URI } from "./URI.js";

export class NodeFileSystem extends FileSystem {
	async fs() {
		try {
			return await import("fs/promises");
		} catch {
			throw new Error("Native file access is not supported in this environment.");
		}
	}

	async supported() {
		return await this.fs().then(()=>true).catch(()=>false);
	}

	async readFile(uri: ReadonlyURI): Promise<ArrayBuffer> {
		return (await this.fs()).readFile(this.#filePath(uri));
	}
	
	async writeFile(uri: ReadonlyURI, content: ArrayBuffer): Promise<void> {
		await this.createDirectory(uri.clone().appendString(".")).catch(()=>void 0);
		await (await this.fs()).writeFile(this.#filePath(uri), new TextDecoder().decode(content));
	}

	async createDirectory(uri: ReadonlyURI): Promise<void> {
		await (await this.fs()).mkdir(this.#filePath(uri), { recursive: true });
	}

	#filePath(uri: ReadonlyURI) {
		return decodeURI(uri.pathname);
	}
}