import { Lexer } from "../../../compiler-builder/Lexer.js";
import { lexer } from "../../../emcl/grammar/lexer.js";

export class EMCLCode {
	constructor(
		readonly root: HTMLElement = document.createElement("code-block"),
		block = true,
	) {
		this.root.classList.add("emcl-code");
		if (block) {
			this.root.append(this._gutter);
			this.root.classList.add("block");
		}
		this.root.append(this._gutter, this._content);
	}

	setText(text: string) {
		lexer.reset();
		const tokens = Lexer.joinAdjacentTokens(lexer.tokenize(text), "ILLEGAL");
		return this.setTokens(tokens);
	}

	setTokens(tokens: Lexer.Token[], tokenMap?: WeakMap<Lexer.Token, Lexer.TokenMapItem>) {
		this._content.textContent = "";

		let totalLines = 0;
		for (const token of tokens) {
			const map = tokenMap?.get(token);
			const el = document.createElement("emcl-code-token");
			el.dataset.type = token.type;
			el.textContent = token.value;
			el.title = `${token.type}`;
			
			if (map) {
				el.title += `\nline: ${map.line + 1}\nchar: ${map.char + 1}`;
			}
			
			this._content.appendChild(el);

			for (const char of token.value) if (char === "\n") totalLines++;
		}

		return this.setGutter(totalLines);
	}

	setGutter(lines: number) {
		this._gutter.textContent = "";
		for (let i = 0, l = lines + 1; i < l; i++) {
			const div = document.createElement("div");
			div.textContent = (i + 1).toString();
			this._gutter.append(div);
		}
		return this;
	}

	private readonly _gutter = document.createElement("emcl-code-gutter");
	private readonly _content = document.createElement("emcl-code-content");
}
