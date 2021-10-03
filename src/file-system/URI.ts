export interface ReadonlyURI {
	readonly scheme: string;
	readonly authority: string;
	readonly directory: readonly string[];
	readonly filename: string;
	clone(): URI;
	
	stem(): string|undefined;
	extension(): string|undefined;
	slug(): string;

	isRoot(): boolean;
	hasSameRootAs(uri: ReadonlyURI): boolean;
	contains(uri: ReadonlyURI, inclusive ?: boolean): boolean;
	isEqualTo(uri: ReadonlyURI): boolean;
	isParentOf(uri: ReadonlyURI): boolean;

	relativePathOf(uri: ReadonlyURI): string;
}

export class URI implements ReadonlyURI {
	constructor(
		public scheme: string = "",
		public authority: string = "",
		public directory: string[] = [],
		public filename: string = "",
	) {}

	static fromString(string: string) {
		try {
			return new URI().setString(string);
		} catch(e) {
			return undefined;
		}
	}

	setString(uriString: string): this {
		const url = new URL(uriString);

		this.scheme = url.protocol.slice(0,-1);
		if (url.pathname.startsWith("//")) {
			this.directory = url.pathname.slice(2).split("/");
			this.authority = this.directory.shift() || "";
		} else {
			this.directory = url.pathname.slice(1).split("/");
			this.authority = url.host;
		}
		
		if (url.pathname.endsWith("/")) {
			this.directory.pop();
		} else {
			this.filename = this.directory.pop() || "";
		}

		return this;
	}

	appendString(path: string, forceDirectory?: boolean): this {
		if (path.includes(":/")) return this.setString(path);

		this.filename = "";
		for (const segment of path.split("/")) {
			if (!segment) continue;
			if (segment === ".") continue;
			if (segment === "..") this.directory.pop();
			this.directory.push(segment);
		}
		if (!forceDirectory && !path.endsWith("/")) this.filename = this.directory.pop() || "";
		return this;
	}

	set(uri: ReadonlyURI): this {
		this.scheme = uri.scheme;
		this.authority = uri.authority;
		this.directory = Array.from(uri.directory);
		this.filename = uri.filename;
		return this;
	}

	setFilename(filename: string) {
		this.filename = filename;
		return this;
	}

	clone(): URI {
		return (new URI).set(this);
	}

	stem(): string|undefined {
		if (!this.filename) return undefined;
		return this.filename.substring(0,this.filename.lastIndexOf('.')) || this.filename;
	}

	extension(): string|undefined {
		if (!this.filename) return undefined;
		const index  = this.filename.lastIndexOf('.');
		return index === -1 ? "" : this.filename.substring(index);
	}

	slug(): string {
		return this.filename || this.directory[this.directory.length - 1] || this.authority;
	}
	
	isRoot(): boolean {
		return !this.directory.length && !this.filename;
	}

	hasSameRootAs(uri: ReadonlyURI): boolean {
		return this.scheme === uri.scheme && this.authority === uri.authority;
	}
	
	contains(uri: ReadonlyURI, inclusive: boolean = false): boolean {
		if (this.filename) return inclusive && this.isEqualTo(uri);

		if (!this.hasSameRootAs(uri)) return false;
		
		if (this.directory.length > uri.directory.length) return false;
		
		if (!inclusive && 
			this.directory.length === uri.directory.length &&
			this.filename && !uri.filename) return false;
		
		for (let i = 0, l = this.directory.length; i < l; i++) {
			if (this.directory[i] !== uri.directory[i]) return false;
		}

		return true;
	}

	isEqualTo(uri: ReadonlyURI): boolean {
		if (!this.hasSameRootAs(uri)) return false;

		if (this.directory.length !== uri.directory.length) return false;

		for (let i = 0, l = this.directory.length; i < l; i++) {
			if (this.directory[i] !== uri.directory[i]) return false;
		}

		if (this.filename !== uri.filename) return false;

		return true;
	}

	isParentOf(uri: ReadonlyURI): boolean {
		return this.directory.length === uri.directory.length && this.contains(uri);
	}

	toString(encode = true): string {
		const scheme = `${this.scheme}:`;
		const authority = this.authority ? `//${this.authority}` : "";
		const path = "/" + (this.directory.length ? `${this.directory.join("/")}/` : "") + this.filename;

		const uri = scheme + authority + path;
		return encode ? encodeURI(uri) : uri;
	}

	relativePathOf(uri: ReadonlyURI): string {
		if (!this.hasSameRootAs(uri)) return uri.toString();

		let self = this.clone();
		self.filename = "";

		let out = "";
		while (!self.contains(uri)) {
			out += "../";
			self.directory.pop();
		}

		out += uri.directory.slice(this.directory.length).join("/") + uri.filename;
		return out;
	}
}