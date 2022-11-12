import { ReadonlyURI } from "./URI.js";

export abstract class FileSystem {
	abstract readFile(uri: ReadonlyURI): Promise<ArrayBuffer>;
	abstract writeFile(uri: ReadonlyURI, content: ArrayBuffer): Promise<void>;

	abstract createDirectory(uri: ReadonlyURI): Promise<void>;

	async readTextFile(uri: ReadonlyURI): Promise<string> {
		const arrayBuffer = await this.readFile(uri);
		return new TextDecoder().decode(arrayBuffer);
	}
	async writeTextFile(uri: ReadonlyURI, content: string): Promise<void> {
		const arrayBuffer = new TextEncoder().encode(content);
		return await this.writeFile(uri, arrayBuffer);
	}
}
