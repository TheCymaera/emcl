export function create(title: string, ...content: HTMLElement[]) {
	const details = document.createElement("details");
	details.classList.add("app-collapsible-panel");

	const summary = document.createElement("summary");
	summary.textContent = title;
	
	details.append(summary, ...content);
	details.open = true;

	return details;
}