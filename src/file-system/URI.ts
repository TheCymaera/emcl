export interface ReadonlyURI {
	readonly scheme: string;
	readonly authority: string;
	readonly pathname: string;

	clone(): URI;

	isFile(): boolean;
	pathSegments(): string[];
	directorySegments(): string[];
	filename(): string;
	slug(): string;

	isOrigin(): boolean;
	hasSameOrigin(uri: ReadonlyURI): boolean;
	
	relativePathOf(uri: ReadonlyURI): string;
	toString(): string;
}

export class URI implements ReadonlyURI {
	constructor(
		public scheme: string = "",
		public authority: string = "",
		public pathname: string = "/",
	) {}

	static fromString(string: string) {
		try {
			return new URI().setString(string);
		} catch(e) {
			return undefined;
		}
	}

	clone(): URI {
		return (new URI).set(this);
	}

	isFile() {
		return !this.pathname.endsWith("/");
	}

	pathSegments(): string[] {
		return this.pathname.slice().split("/").filter(i=>i);
	}

	directorySegments(): string[] {
		const segments = this.pathSegments();
		if (this.isFile()) segments.pop();
		return segments;
	}

	filename() {
		if (!this.isFile()) return "";
		const segments = this.pathSegments();
		return segments.pop() ?? "";
	}

	slug() {
		return this.pathSegments().pop() ?? this.authority;
	}

	appendString(path: string): this {
		URI._setFromURL(this, new URL(path, this.toString()));
		return this;
	}

	setString(uriString: string): this {
		URI._setFromURL(this, new URL(uriString));
		return this;
	}

	set(uri: ReadonlyURI): this {
		this.scheme = uri.scheme;
		this.authority = uri.authority;
		this.pathname = uri.pathname;
		return this;
	}

	isOrigin() {
		return this.pathname === "/";
	}

	hasSameOrigin(uri: ReadonlyURI): boolean {
		return this.scheme === uri.scheme && this.authority === uri.authority;
	}

	relativePathOf(uri: ReadonlyURI): string {
		if (!this.hasSameOrigin(uri)) return uri.toString();

		const base = this.directorySegments();
		const rel = this.directorySegments();

		const contained = (array1: string[], array2: string[])=>{
			for (let i = 0, l = array1.length; i < l; i++) {
				if (array1[i] !== array2[i]) return false;
			}
			return true;
		}

		let out = "";
		while (!contained(base, rel)) {
			out += "../";
			base.pop();
		}

		out += uri.filename();
		return out;
	}

	toString(encode = true): string {
		const scheme = `${this.scheme}:`;
		const authority = this.authority ? `//${this.authority}` : "";
		const pathname = this.pathname;


		const uri = scheme + authority + pathname;
		return encode ? encodeURI(decodeURI(uri)) : uri;
	}

	setPathSegments(directories: string[], file?: string) {
		this.pathname = "/"+ directories.join("/") + (file ? "/" + file : "");
		return this;
	}

	ascend(levels: number) {
		const segments = this.directorySegments();
		segments.length -= levels;
		return this.setPathSegments(segments);
	}

	descend(directories: string[], file?: string) {
		return this.setPathSegments([...this.directorySegments(), ...directories], file);
	}

	asFile() {
		if (this.pathname.endsWith("/")) this.pathname = this.pathname.slice(0, -1);
		return this;
	}

	asDirectory() {
		if (!this.pathname.endsWith("/")) this.pathname += "/";
		return this;
	}

	private static _setFromURL(self: URI, url: URL) {
		self.scheme = url.protocol.slice(0,-1);
		self.authority = url.host;

		if (url.pathname.startsWith("//")) {
			const pathIndex = url.pathname.indexOf("/", 3);
			const pathIndexCapped = pathIndex === -1 ? url.pathname.length : pathIndex;
			self.authority = url.pathname.slice(2, pathIndexCapped);
			self.pathname = url.pathname.slice(pathIndexCapped);
		} else {
			self.pathname = url.pathname;
		}
	}
}