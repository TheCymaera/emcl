export class Console {
	constructor(
		readonly root = document.createElement("console-"),
	) {}
	
	log(text : string) {
		return this._append(text, "info");
	}

	error(text: string) {
		return this._append(text, "error");
	}

	warn(text : string) {
		return this._append(text, "warn");
	}

	clear() {
		this.root.textContent = "";
		return this;
	}

	private _append(text: string, severity: string) {
		const element = document.createElement("div");
		element.textContent = text;
		element.dataset["severity"] = severity;
		this.root.append(element);
		element.scrollIntoView({ block: "nearest" });
		return this;
	}
}