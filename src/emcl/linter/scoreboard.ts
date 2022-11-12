export const illegalObjectiveCharacters = /[^\w\-\+\.]/g;
export const maxObjectiveLength = 16;
export function lintObjective(objective: string) {
	let reasons: string[] = [];
	if (objective.length > maxObjectiveLength) {
		reasons.push("Scoreboard objectives can contain at most 16 characters."); 
	}
	if (objective.match(illegalObjectiveCharacters)) {
		reasons.push(`Objective contains illegal characters.`);
	}
 
	if (!reasons.length) return;
	return `"${objective}" is not a valid scoreboard objective name.\n` + reasons.join("\n");
}