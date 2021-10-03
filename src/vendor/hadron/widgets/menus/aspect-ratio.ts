export class AspectRatioElement extends HTMLElement {
	constructor() {super();
		AspectRatioElement.observer.observe(this);
	}

	update() {
		this.style.setProperty("--clientWidth", this.clientWidth + "px");
		this.style.setProperty("--clientHeight", this.clientHeight + "px");
	}

	static readonly observer = new ResizeObserver((entries)=>{
		for (const entry of entries) (entry.target as AspectRatioElement).update();
	});
}

customElements.define("aspect-ratio", AspectRatioElement);