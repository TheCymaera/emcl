import { FileSystem } from "./FileSystem.js";
import { ReadonlyURI, URI } from "./URI.js";

export class FSAFileSystem extends FileSystem {
	scheme = "fsa";
	readonly handles: ReadonlyMap<string, FileSystemHandle>;
	readonly onRegisterHandle: Set<(event: { uri: ReadonlyURI })=>any> = new Set;

	constructor(handles: Map<string, FileSystemHandle> = new Map) {super();
		this.handles = handles;
	}

	registerHandle(authority: string, handle: FileSystemHandle) {
		(this.handles as Map<string, FileSystemHandle>).set(authority, handle);
		const uri = new URI(this.scheme, authority);
		for (const callback of this.onRegisterHandle) callback({ uri });
		return uri;
	}

	availableAuthority(name: string): string {
		let out = name, i = 0;
		while (this.handles.has(out)) out = `${name} ${++i}`;
		return out;
	}

	async getURI(handle: FileSystemHandle): Promise<undefined|URI> {
		if (handle instanceof FileSystemFileHandle) {
			for (const [authority, root] of this.handles) {
				if (root instanceof FileSystemFileHandle && await root.isSameEntry(handle)) {
					return new URI(this.scheme, authority);
				}
			}
		} else {
			for (const [authority, root] of this.handles) {
				if (root instanceof FileSystemDirectoryHandle) {
					const path = await root.resolve(handle);
					if (path) return new URI(this.scheme, authority, "/" + path.join("/"));
				}
			}
		}
		
		return undefined;
	}

	async readFile(uri: ReadonlyURI) {
		const handle = await this._getFile(uri, false);
		const file = await handle.getFile();
		return await file.arrayBuffer();
	}

	async writeFile(uri: ReadonlyURI, content: ArrayBuffer) {
		const handle = await this._getFile(uri, true);
		// TODO: Remove when TS updates definitions.
		// @ts-expect-error
		const writable = await handle.createWritable();
		await writable.write(content);
		await writable.close();
	}

	async createDirectory(uri: ReadonlyURI) {
		await this._getDirectory(uri, true);
	}

	private async _getFile(uri: ReadonlyURI, create: boolean) {
		if (uri.isOrigin()) return await this._getRoot(uri, "file");
		const parent = await this._getDirectory(uri, create);
		return await parent.getFileHandle(uri.filename(), { create });
	}

	private async _getDirectory(uri: ReadonlyURI, create: boolean) {
		let handle = await this._getRoot(uri, "directory");
		for (const segment of uri.directorySegments()) {
			handle = await handle.getDirectoryHandle(segment, { create })
		}
		return handle;
	}

	private async _getRoot(uri: ReadonlyURI, kind: "file"): Promise<FileSystemFileHandle>;
	private async _getRoot(uri: ReadonlyURI, kind: "directory"): Promise<FileSystemDirectoryHandle>;
	private async _getRoot(uri: ReadonlyURI, kind: "file"|"directory"): Promise<FileSystemHandle> {
		const handle = this.handles.get(uri.authority);
		if (!handle) throw new Error(`Resource not found.`);
		if (uri.isOrigin() || handle.kind !== kind) throw new Error(`Illegal Operation!`);
		return handle;
	}
}