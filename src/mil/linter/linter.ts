export const illegalNamespacedCharacters = /[^a-z\d_\-\/\.:]/g;
export function validateNamespacedId(namespacedId: string) {
	const components = namespacedId.split(":");
	const reasons: string[] = [];
	if (components.length !== 2) {
		reasons.push(`Namespaced ids should have the format "namespace:id".`);
	}
	
	if (components[0]!.includes("/")) {
		reasons.push(`Namespaces cannot contain slashes.`);
	}

	if (namespacedId.match(illegalNamespacedCharacters)) {
		if (namespacedId.toLowerCase() !== namespacedId) {
			reasons.push(`Namespaced ids cannot contain uppercase letters.`);
		} else {
			reasons.push(`Namespaced id contains illegal characters.`);
		}
	}

	if (!reasons.length) return;
	return `"${namespacedId}" is not a valid namespaced id.\n` + reasons.join("\n");
}

export const illegalScoreboardObjectiveCharacters = /[^\w\-\+\.]/g;
export const maxScoreboardObjectiveLength = 16;
export function validateScoreboardObjective(objective: string) {
	let reasons: string[] = [];
	if (objective.length > maxScoreboardObjectiveLength) {
		reasons.push("Scoreboard objectives can contain at most 16 characters."); 
	}
	if (objective.match(illegalScoreboardObjectiveCharacters)) {
		reasons.push(`Objective contains illegal characters.`);
	}
 
	if (!reasons.length) return;
	return `"${objective}" is not a valid scoreboard objective name.\n` + reasons.join("\n");
}