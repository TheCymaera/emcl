import * as app from "../../app.js";
import { lexer } from "emcl";
import { CodeViewer } from "../components/CodeViewer.js";
import * as collapsiblePanel from "../components/collapsiblePanel.js";
import * as mil from "mil";
import * as milOptimizer from "mil-optimizer";
import { fa5_solid_stepBackward, fa5_solid_fastBackward, fa5_solid_stepForward, fa5_solid_fastForward } from "fontawesome-svgs";

// wow this sucks
export const element = document.createElement("app-optimizer");
element.style.overflow = "auto";

const main = document.createElement("div");
const footer = document.createElement("div");
const backwardButton = document.createElement("app-optimizer-button");
const forwardButton = document.createElement("app-optimizer-button");
const fastBackwardButton = document.createElement("app-optimizer-button");
const fastForwardButton = document.createElement("app-optimizer-button");
const message = document.createElement("code-block");
message.style.whiteSpace = "pre";
footer.append(fastBackwardButton, backwardButton, forwardButton, fastForwardButton, message);

backwardButton.innerHTML = fa5_solid_stepBackward;
backwardButton.onclick = ()=>setPage(currentPage - 1);
forwardButton.innerHTML = fa5_solid_stepForward;
forwardButton.onclick = ()=>setPage(currentPage + 1);
fastBackwardButton.innerHTML = fa5_solid_fastBackward;
fastBackwardButton.onclick = ()=>setPage(0);
fastForwardButton.innerHTML = fa5_solid_fastForward;
fastForwardButton.onclick = ()=>setPage(Infinity);

element.append(main, footer);

const snapshots: [mil.Program, milOptimizer.Changes|undefined][] = [];

app.compiler.onCompile.add((compilation)=>{
	snapshots.length = 0;
	snapshots.push([compilation.program.clone(), undefined]);
});
app.compiler.onTransform.add((compilation, changes)=>snapshots.push([compilation.program.clone(), changes]));
app.compiler.onComplete.add(()=>setPage(0));

let currentPage = 0;
function setPage(page: number) {
	const minPage = 0;
	const maxPage = snapshots.length - 1;
	currentPage = Math.max(0, Math.min(page, maxPage));

	backwardButton.toggleAttribute("data-disabled", currentPage === minPage);
	fastBackwardButton.toggleAttribute("data-disabled", currentPage === minPage);
	forwardButton.toggleAttribute("data-disabled", currentPage === maxPage);
	fastForwardButton.toggleAttribute("data-disabled", currentPage === maxPage);

	const oldSnapshot = snapshots[currentPage];
	const newSnapshot = snapshots[currentPage + 1];

	main.textContent = "";

	if (!oldSnapshot) return;

	if (newSnapshot) {
		const changes = newSnapshot[1]!;
		main.append(renderPage(oldSnapshot[0], newSnapshot[0], changes));
		message.textContent = currentPage + ": " + changes.type;
	} else {
		main.append(renderPage(oldSnapshot[0], undefined, undefined));
		message.textContent = currentPage + ": " + "Complete!";
	}

	function renderPage(
		lhs: mil.Program, 
		rhs: mil.Program|undefined, 
		changes: undefined|milOptimizer.Changes,
	) {
		const page = new DocumentFragment;

		for (const [name] of lhs.branches) {
			const lhsBlock = lhs.branches.get(name)!;
			const rhsBlock = rhs?.branches.get(name);

			const lhsCode = new CodeViewer("emcl", lexer);
			const rhsCode = new CodeViewer("emcl", lexer);

			lhsCode.setText(lhsBlock.map(i=>i.displayText()).join("\n"));
			if (rhsBlock) {
				rhsCode.setText(rhsBlock.map(i=>i.displayText()).join("\n"));
				page.append(collapsiblePanel.create(name, splitView(lhsCode.root, rhsCode.root)));
			} else {
				page.append(collapsiblePanel.create(name, lhsCode.root));
			}

			if (!changes) continue;

			for (const removed of changes.removed) {
				for (const instruction of removed.instructions) {
					lhsCode.addGutterNote(lhsBlock.indexOf(instruction), removed.message, "var(--color-red-500)");
				}

			}
			
			for (const [i, change] of changes.replaced.entries()) {
				const change = changes.replaced[i]!;
				const color = getRandomColor();

				for (const instruction of change.instructions) {
					lhsCode.addGutterNote(lhsBlock.indexOf(instruction), change.message, color);
				}
				if (rhsBlock) {
					for (const instruction of change.replacements) {
						rhsCode.addGutterNote(rhsBlock.indexOf(instruction), change.message, color);
					}
				}
			}
		}
		
		return page;
	}

	function splitView(lhs: HTMLElement, rhs: HTMLElement) {
		const container = document.createElement("div");
		container.style.display = "grid";
		container.style.gridTemplateColumns = "50% 50%";
		container.append(lhs, rhs)
		return container;
	}

	function getRandomColor() {
		const brightness = 100;
		const range = (255 - brightness);
		const r = brightness + Math.random() * range;
		const g = brightness + Math.random() * range;
		const b = brightness + Math.random() * range;
		return `rgb(${r},${g},${b})`;
	}
}
