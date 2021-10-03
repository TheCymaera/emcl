export class MultiviewPageElement extends HTMLElement {
	constructor() {super();
		MultiviewPageElement.resizeObserver.observe(this);
		// predict and update layout to avoid animation
		setTimeout(()=>this.p_updateLayout(), 0);
	}

	get menu() {
		if (this.p_menu) return this.p_menu;
		return this.p_menu = this.querySelector("multiview-page-submenu")!;
	}

	get submenu() {
		if (this.p_submenu) return this.p_submenu;
		return this.p_submenu = this.querySelector("multiview-page-submenu")!;
	}

	get submenuOpened() {
		return this.dataset.submenuOpened !== undefined;
	}

	set submenuOpened(opened: boolean) {
		this.toggleSubmenuOpened(opened);
	}

	toggleSubmenuOpened(opened?: boolean) {
		this.toggleAttribute("data-submenu-opened", opened);
		return this;
	}

	static readonly resizeObserver = new ResizeObserver((entries)=>{
		for (const entry of entries) (entry.target as MultiviewPageElement).p_updateLayout();
	});

	private p_menu: HTMLElement;
	private p_submenu: HTMLElement;
	private p_updateLayout() {
		const mobileBreakpoint = (parseInt(this.dataset.mobileBreakpoint!) || 600);
		const currentWidth = this.clientWidth || window.innerWidth;
		
		this.classList.add("multiview-page-disable-transitions");
		this.classList.toggle(MultiviewPageElement.Classes.Mobile, currentWidth < mobileBreakpoint);
		setTimeout(()=>this.classList.remove("multiview-page-disable-transitions"), 0);
	}
}

export namespace MultiviewPageElement {
	export enum Classes {
		Mobile = "multiview-page-mobile",
		MobileOnly = "multiview-page-mobile-only",
		SubmenuOpenedOnly = "multiview-page-submenu-opened-only"
	}
}

customElements.define("multiview-page", MultiviewPageElement)