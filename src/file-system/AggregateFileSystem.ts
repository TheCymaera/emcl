import { FileSystem } from "./FileSystem";
import { ReadonlyURI } from "./URI";

export class AggregateFileSystem implements FileSystem {
	readonly schemes: Map<string, FileSystem> = new Map;

	readFile(uri: ReadonlyURI): Promise<ArrayBuffer> {
		return this._getFileSystem(uri).readFile(uri);
	}

	createDirectory(uri: ReadonlyURI): Promise<void> {
		return this._getFileSystem(uri).createDirectory(uri);
	}
	
	writeFile(uri: ReadonlyURI, content: ArrayBuffer): Promise<void> {
		return this._getFileSystem(uri).writeFile(uri, content);
	}
	
	readTextFile(uri: ReadonlyURI): Promise<string> {
		return this._getFileSystem(uri).readTextFile(uri);
	}

	writeTextFile(uri: ReadonlyURI, content: string): Promise<void> {
		return this._getFileSystem(uri).writeTextFile(uri, content);
	}

	private _getFileSystem(uri: ReadonlyURI): FileSystem {
		const fs = this.schemes.get(uri.scheme);
		if (!fs) throw new Error(`"${uri.scheme}" is not a registered file system!`);
		return fs;
	}
}