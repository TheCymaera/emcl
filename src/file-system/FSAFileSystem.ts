import { FileSystem } from "./FileSystem";
import { ReadonlyURI, URI } from "./URI";

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
		if (handle.kind === "file") {
			for (const [authority, root] of this.handles) {
				if (root.kind === "file" && await root.isSameEntry(handle)) {
					return new URI(this.scheme, authority);
				}
			}
		} else {
			for (const [authority, root] of this.handles) {
				if (root.kind === "directory") {
					const path = await root.resolve(handle);
					if (path) return new URI(this.scheme, authority, path);
				}
			}
		}
		
		return undefined;
	}

	async readFile(uri: ReadonlyURI) {
		const handle = await this._getHandle(uri, false, "file");
		const file = await handle.getFile();
		return await file.arrayBuffer();
	}

	async writeFile(uri: ReadonlyURI, content: ArrayBuffer) {
		const handle = await this._getHandle(uri, true, "file");
		const writable = await handle.createWritable();
		await writable.write(content);
		await writable.close();
	}

	async createDirectory(uri: ReadonlyURI) {
		await this._getHandle(uri, true, "directory");
	}

	private async _getHandle(uri: ReadonlyURI, create: boolean, kind: "file"): Promise<FileSystemFileHandle>;
	private async _getHandle(uri: ReadonlyURI, create: boolean, kind: "directory"): Promise<FileSystemDirectoryHandle>;
	private async _getHandle(uri: ReadonlyURI, create: boolean, kind: "file"|"directory") {
		if (uri.isRoot()) return await this._getRoot(uri, kind);
		const parent = await this._getParent(uri, create);
		if (kind === "file") {
			return await parent.getFileHandle(uri.filename, { create });
		} else {
			return await parent.getDirectoryHandle(uri.filename, { create });
		}
	}

	private async _getRoot(uri: ReadonlyURI, kind: "file"): Promise<FileSystemFileHandle>;
	private async _getRoot(uri: ReadonlyURI, kind: "directory"): Promise<FileSystemDirectoryHandle>;
	private async _getRoot(uri: ReadonlyURI, kind: "file"|"directory"): Promise<FileSystemHandle>;
	private async _getRoot(uri: ReadonlyURI, kind: "file"|"directory"): Promise<FileSystemHandle> {
		const handle = this.handles.get(uri.authority);
		if (!handle) throw new Error(`Resource not found.`);
		if (uri.isRoot() || handle.kind !== kind) throw new Error(`Illegal Operation!`);
		return handle;
	}

	private async _getParent(uri: ReadonlyURI, create: boolean) {
		let handle = await this._getRoot(uri, "directory");
		for (const segment of uri.directory) {
			handle = await handle.getDirectoryHandle(segment, { create })
		}
		return handle;
	}
}