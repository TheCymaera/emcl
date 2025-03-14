import { FileSystem } from "./FileSystem.js";
import { type ReadonlyURI } from "./URI.js";

export class AggregateFileSystem implements FileSystem {
	readonly schemes: Map<string, FileSystem> = new Map;

	createDirectory(uri: ReadonlyURI): Promise<void> {
		return this._getFileSystem(uri).createDirectory(uri);
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