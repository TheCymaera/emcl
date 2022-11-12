import { Lexer } from "../../../compiler-builder/Lexer.js";

export class CodeViewer {
	readonly root: HTMLElement = document.createElement("code-viewer");
	constructor(
		readonly lang: string,
		readonly lexer?: Lexer,
		block = true,
	) {
		this.root.dataset.lang = lang;
		if (block) {
			this.root.append(this._gutter);
			this.root.classList.add("block");
		}
		this.root.append(this._gutter, this._content);
	}

	setText(text: string) {
		if (this.lexer) {
			this.lexer.reset();
			const tokens = Lexer.joinAdjacentTokens(this.lexer.tokenize(text), "ILLEGAL");
			this.setTokens(tokens);
		} else {
			this.setTokens([{type: "plain-text", value: text}]);
		}
		return this;
	}

	setTokens(tokens: Lexer.Token[], tokenMap?: WeakMap<Lexer.Token, Lexer.TokenMapItem>) {
		this._content.textContent = "";

		let totalLines = 0;
		for (const token of tokens) {
			const map = tokenMap?.get(token);
			const el = document.createElement("code-viewer-token");
			el.dataset.type = token.type;
			el.textContent = token.value;
			el.title = `${token.type}`;
			
			if (map) {
				el.title += `\nline: ${map.line + 1}\nchar: ${map.char + 1}`;
			}
			
			this._content.appendChild(el);

			for (const char of token.value) if (char === "\n") totalLines++;
		}

		this._updateGutter(totalLines);
		return this;
	}

	highlightError(tokenIndex: number) {
		const token = this._content.children[tokenIndex];
		if (token) token.toggleAttribute("data-error", true);
		return this;
	}

	addGutterNote(number: number, message: string, color: string) {
		const line = this._gutter.children[number] as HTMLElement|undefined;
		if (line) {
			line.dataset.message = line.dataset.message ? (line.dataset.message + "\n" + message) : message;
			line.title = line.dataset.message;
			line.style.setProperty("--highlight-color", color);
		}
	}

	private readonly _gutter = document.createElement("code-viewer-gutter");
	private readonly _content = document.createElement("code-viewer-content");

	private _updateGutter(lines: number) {
		this._gutter.textContent = "";
		for (let i = 0, l = lines + 1; i < l; i++) {
			const div = document.createElement("div");
			div.textContent = (i + 1).toString();
			this._gutter.append(div);
		}
	}
}
