import { type ReadonlyURI } from "./URI.js";

export abstract class FileSystem {
	abstract createDirectory(uri: ReadonlyURI): Promise<void>;
	abstract readTextFile(uri: ReadonlyURI): Promise<string>;
	abstract writeTextFile(uri: ReadonlyURI, content: string): Promise<void>;
}
