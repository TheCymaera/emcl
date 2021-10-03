export class SearchableSelectElement<T = string> extends HTMLElement {
	static defaultContextMenuContainer: HTMLElement = 
		document.querySelector("searchable-select-context-menu-container") ||
		document.createElement("searchable-select-context-menu-container");

	readonly contextMenu = new SearchableSelectElement.ContextMenu<T>();
	contextMenuContainer = SearchableSelectElement.defaultContextMenuContainer;
	maxRenderedOptions = 300;

	readonly onChange: Set<()=>any> = new Set;

	constructor() {super();
		// open contextmenu on click, prevent default to maintain focus.
		this.addEventListener("mousedown",(event)=>{
			if (!this.contextMenu.isOpened()) event.preventDefault(), this.openMenu();
		});

		// open menu when user presses 'Enter'
		this.addEventListener("keydown",(event)=>{
			if (event.code === "Enter") this.openMenu();
		});

		this.contextMenu.input.addEventListener("input",()=>this.updateOptions());
		this.contextMenu.input.addEventListener("focus",()=>{
			this.contextMenu.input.value = "";
			this.updateOptions();
		});
		this.contextMenu.input.addEventListener("blur",()=>this.closeMenu());
		
		// Prevent context menu from loosing focus during mouse events
		this.contextMenu.element.addEventListener("mousedown", (event)=>event.preventDefault());
		this.contextMenu.cancelButton.addEventListener("mousedown", ()=>this.closeMenu());

		// select context menu item on click.
		this.contextMenu.list.addEventListener("click",(event)=>{
			const path = event.composedPath();
			const element = path[path.indexOf(this.contextMenu.list) - 1] as HTMLElement|undefined;
			if (element) {
				this.value = this.p_elementToValue.get(element)!;
				this.closeMenu();
				this.p_change();
			}
		});

		// context menu keyboard controls
		this.contextMenu.input.addEventListener("keydown",(event)=>{
			switch(event.code) {
				case "Enter"	: selectFocus(); event.preventDefault(); break;
				case "ArrowUp"	: this.contextMenu.moveFocus(-1); event.preventDefault(); break;
				case "ArrowDown": this.contextMenu.moveFocus(1); event.preventDefault(); break;
			}
		});

		const selectFocus = ()=>{
			const focus = this.contextMenu.focus();
			if (focus) {
				this.value = this.p_elementToValue.get(focus)!;
				this.closeMenu();
				this.p_change();
			}
		}
	}

	connectedCallback() {
		// ignore IOS safari as tabIndex can cause problems.
		if (navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/)) 
			return;

		if (this.tabIndex === -1) this.tabIndex = 0;
	}

	get readOnly() {
		return this.hasAttribute("data-readonly");
	}
	
	set readOnly(value: boolean) {
		this.toggleAttribute("data-readonly", value);
		if (value) this.closeMenu();
	}

	set value(value: T) {
		this.p_value = value;
		this.textContent = "";
		this.append(this.elementBuilder(value, true));
	}

	get value(): T {
		return this.p_value;
	}

	set selectedIndex(index: number) {
		const options = this.optionsProvider("");
		if (index >= 0 && index < options.length) this.value = options[index]!;
	}

	get selectedIndex() {
		return this.optionsProvider("").indexOf(this.value);
	}

	openMenu() {
		if (this.readOnly) return this.focus();

		this.contextMenuContainer.textContent = "";
		this.contextMenuContainer.append(this.contextMenu.element);
		
		this.contextMenuContainer.style.display = "block";
		this.contextMenu.input.focus();
		this.contextMenuContainer.style.display = "";

		const containerRect = this.contextMenuContainer.getBoundingClientRect();
		const rect = this.getBoundingClientRect();

		const left = rect.left - containerRect.left;
		const width = rect.width;
		const top = rect.top - containerRect.top;
		const bottom = containerRect.bottom - rect.bottom;

		this.contextMenu.element.style.setProperty("--left", left + "px");
		this.contextMenu.element.style.setProperty("--width", width + "px");
		if (bottom >= top) {
			this.contextMenu.element.style.setProperty("--top", `calc(100% - ${bottom}px)`);
			this.contextMenu.element.style.setProperty("--height", bottom + "px");
			this.contextMenu.element.style.setProperty("--bottom", "unset");
		} else {
			this.contextMenu.element.style.setProperty("--bottom", `calc(100% - ${top}px)`);
			this.contextMenu.element.style.setProperty("--height", top + "px");
			this.contextMenu.element.style.setProperty("--top", "0px");
		}
	}

	closeMenu() {
		if (!this.contextMenu.isOpened()) return;
		this.focus({ preventScroll: true });
		this.contextMenuContainer.textContent = "";
	}

	updateOptions() {
		const options = this.optionsProvider(this.contextMenu.input.value).slice(0, this.maxRenderedOptions);

		this.contextMenu.list.textContent = "";
		this.contextMenu.list.append(...options.map(option=>{
			const element = this.elementBuilder(option, false);
			this.p_elementToValue.set(element, option);
			return element;
		}));
	}

	elementBuilder: SearchableSelectElement.OptionElementProvider<T> = SearchableSelectElement.defaultElementBuilder;
	optionsProvider: SearchableSelectElement.OptionsProvider<T> = SearchableSelectElement.defaultOptionsProvider;

	static defaultElementBuilder: SearchableSelectElement.OptionElementProvider<any> = (option)=> {
		const element = document.createElement("searchable-select-option");
		element.textContent = `${option}`;
		return element;
	}
	static defaultOptionsProvider: SearchableSelectElement.OptionsProvider<any> = ()=>[];

	static FILTER_FROM_LIST<T>(
		listProvider: T[] | (()=>T[]), 
		stringFunction = (option: T)=>JSON.stringify(option).toLowerCase()
	): SearchableSelectElement.OptionsProvider<T> {
		function fuzzyMatch(string: string, pattern: string) {
			const index = string.indexOf(pattern);
			if (index === -1) return 0;
			return 1000 - index;
		}

		if (listProvider instanceof Array) {
			const list = listProvider;
			listProvider = ()=>list;
		}

		return (pattern)=>{
			const list = (listProvider as ()=>T[])();
			if (!pattern) return list;

			const patternNormalized = pattern.toLowerCase();
			const matches: [number,T][] = [];
			
			for (const option of list) {
				const optionString = stringFunction(option);
				const similarity = fuzzyMatch(optionString, patternNormalized);
				if (similarity > 0) matches.push([similarity, option]);
			}
			return matches.sort().reverse().map(i=>i[1]);
		}
	}

	private p_value: T;
	private readonly p_elementToValue: WeakMap<HTMLElement, T> = new WeakMap;

	private p_change() {
		for (const callback of this.onChange) callback.call(this);
	}
}

export namespace SearchableSelectElement {
	export type OptionElementProvider<T> = (this: SearchableSelectElement<T>, value: T, isHandle: boolean)=>HTMLElement;
	export type OptionsProvider<T> = (this: SearchableSelectElement<T>, searchTerm: string)=>T[];

	export class ContextMenu<T> {
		readonly element: HTMLElement = contextMenuTemplate.cloneNode(true) as HTMLElement;
		readonly input = this.element.querySelector("input")!;
		readonly cancelButton = this.element.querySelector("searchable-select-cancel") as HTMLElement;
		readonly list = this.element.querySelector("searchable-select-list") as HTMLElement;

		isOpened() {
			return document.activeElement === this.input;
		}

		focus() {
			return this.list.getElementsByClassName(ContextMenu.focusClassName)[0] as HTMLElement|undefined;
		}

		moveFocus(delta: -1|1) {
			const currentFocus = this.focus();
			if (!currentFocus) {
				this.list.children[0]?.classList.add(ContextMenu.focusClassName);
			} else {
				const newFocus = delta < 0 ? currentFocus.previousElementSibling : currentFocus.nextElementSibling;
				if (newFocus) {
					currentFocus.classList.remove(ContextMenu.focusClassName);
					newFocus.classList.add(ContextMenu.focusClassName);
					newFocus.scrollIntoView({block: "nearest"});
				}
			}
		}

		static readonly focusClassName = "searchable-select-focus";
	}
}

const contextMenuTemplate = document.createElement("searchable-select-context-menu");
contextMenuTemplate.innerHTML = /*html*/`
<searchable-select-search>
	<searchable-select-cancel><i class="fa fa-angle-left"></i></searchable-select-cancel>
	<input class="searchable-select-input" type="text" placeholder="Search"/>
</searchable-select-search>
<searchable-select-list></searchable-select-list>
`;

customElements.define("searchable-select", SearchableSelectElement);



