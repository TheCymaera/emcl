export class CanvasAppElement<T extends HTMLElement = HTMLCanvasElement> extends HTMLElement {
	constructor() {super();
		CanvasAppElement.resizeObserver.observe(this);
		// predict and update layout to avoid animation
		setTimeout(()=>this.p_updateLayout(), 0);

		
	}

	get sidebar() {
		if (this.p_sidebar) return this.p_sidebar;
		return this.p_sidebar = this.querySelector("canvas-app-sidebar") as HTMLElement;
	}
	
	get canvas() {
		if (this.p_canvas) return this.p_canvas;
		return this.p_canvas = this.querySelector(".canvas-app-canvas") as T;
	}

	get dialogOpened() {
		return this.dataset.sidebarOpened !== undefined;
	}

	set dialogOpened(value: boolean) {
		this.toggleDialogOpened(value);
	}

	toggleDialogOpened(opened?: boolean) {
		this.toggleAttribute("data-dialog-opened", opened);
		return this;
	}

	get sidebarOpened() {
		return this.dataset.sidebarOpened !== undefined;
	}

	set sidebarOpened(value: boolean) {
		this.toggleDialogOpened(value);
	}

	toggleSidebarOpened(opened?: boolean) {
		this.toggleAttribute("data-sidebar-opened", opened);
		return this;
	}

	downloadCanvasAsImage(settings?: CanvasAppElement.DownloadCanvasAsImageSettings) {
		if (this.canvas instanceof HTMLCanvasElement) {
			const anchor = document.createElement("a");
			anchor.href = this.canvas.toDataURL(settings?.format ?? "img/png", settings?.quality);
			anchor.download = settings?.name ?? "untitled.png";
			anchor.click();
		} else {
			throw new Error(`Element type '${this.canvas.constructor.name}' cannot be converted to an image.`);
		}
	}

	static readonly resizeObserver = new ResizeObserver((entries)=>{
		for (const entry of entries) (entry.target as CanvasAppElement).p_updateLayout();
	});

	private p_sidebar?: HTMLElement;
	private p_canvas?: T;
	private p_updateLayout() {
		const mobileBreakpoint = (parseInt(this.dataset.mobileBreakpoint!) || 600);
		const currentWidth = this.clientWidth || window.innerWidth;

		this.classList.add("canvas-app-disable-transitions");
		this.classList.toggle(CanvasAppElement.Classes.Mobile, currentWidth < mobileBreakpoint);
		setTimeout(()=>this.classList.remove("canvas-app-disable-transitions"), 0);
	}
}

export namespace CanvasAppElement {
	export enum Classes {
		Mobile = "canvas-app-mobile",
		Canvas = "canvas-app-canvas",
	}

	export interface DownloadCanvasAsImageSettings {
		name?: string,
		format?: string,
		quality?: any
	}
}

customElements.define("canvas-app", CanvasAppElement);