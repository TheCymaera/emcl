const filledClasses = `
cursor-pointer
rounded-full py-2 px-5

bg-primary-500 text-onPrimary 
not-disabled:hover:bg-primary-600
not-disabled:active:bg-primary-700
not-disabled:data-pressed:bg-primary-700
data-on:bg-primary-600

transition-colors

focus-visible:outline-[3px] outline-primary-500 outline-offset-[3px]
disabled:opacity-50

text-center
[text-decoration:inherit]
`

const outlinedClasses = `
cursor-pointer
rounded-full py-2 px-5

border-[.08rem] border-containerBorder
not-disabled:hover:bg-inkWell/10
not-disabled:active:bg-inkWell/20
[&:not(:disabled)][&[data-pressed]]:bg-inkWell/20
data-on:bg-primary-500/30!
data-on:border-transparent!

transition-colors 

focus-visible:outline-[3px] outline-primary-500 outline-offset-[-3px]
disabled:opacity-50

text-center
[text-decoration:inherit]
`

const inkWellClasses = `
cursor-pointer
text-inherit
hover:bg-inkWell/15
active:bg-inkWell/25
data-pressed:bg-inkWell/25
data-on:bg-inkWell/10!

transition-colors

focus-visible:outline-[3px] outline-primary-500 outline-offset-[-3px]
disabled:opacity-70

[text-align:inherit]
[text-decoration:inherit]
`

const cardClasses = `
cursor-pointer
rounded-xl

bg-surfaceContainer text-onSurfaceContainer 

relative z-0
before:rounded-xl before:absolute before:inset-0 before:content before:bg-inkWell before:opacity-0 before:z-[-1]
hover:before:opacity-15
active:before:opacity-25
data-pressed:before:opacity-25

disabled:before:!opacity-0
data-on:before:bg-primary-500!
data-on:before:opacity-30!

before:transition-[opacity,background-color]
transition-colors

focus-visible:outline-[3px] outline-primary-500 outline-offset-[-3px]
disabled:opacity-50

[text-align:inherit]
[text-decoration:inherit]
`

export const buttonVariants = {
	inkWell: inkWellClasses,
	filled: filledClasses,
	outlined: outlinedClasses,
	card: cardClasses,
	unstyled: "",
}



export function buttonBehaviour(element: HTMLElement) {
	const minPressTime = 200;


	function press() {
		element.dataset.pressed = "";
		setTimeout(() => delete element.dataset.pressed, minPressTime);
	}

	element.addEventListener("pointerdown", press);

	return {
		destroy() {
			element.removeEventListener("pointerdown", press);
		}
	}
}