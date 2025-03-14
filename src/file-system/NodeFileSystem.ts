import { FileSystem } from "./FileSystem.js";
import { type ReadonlyURI } from "./URI.js";

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

	async readTextFile(uri: ReadonlyURI): Promise<string> {
		const fs = await this.fs();
		const filePath = this.#filePath(uri);
		return await fs.readFile(filePath, { encoding: "utf8" });
	}

	async writeTextFile(uri: ReadonlyURI, content: string): Promise<void> {
		const fs = await this.fs();
		const filePath = this.#filePath(uri);
		await fs.mkdir(filePath.substring(0, filePath.lastIndexOf("/")), { recursive: true });
		await fs.writeFile(filePath, content, { encoding: "utf8" });
	}

	async createDirectory(uri: ReadonlyURI): Promise<void> {
		await (await this.fs()).mkdir(this.#filePath(uri), { recursive: true });
	}

	#filePath(uri: ReadonlyURI) {
		return decodeURI(uri.pathname);
	}
}