export const illegalCharacters = /[^a-z\d_\-\/\.:]/g;
export function lint(namespacedId: string) {
	const components = namespacedId.split(":");
	const reasons: string[] = [];
	if (components.length !== 2) {
		reasons.push(`Namespaced ids should have the format "namespace:id".`);
	}
	
	if (components[0]!.includes("/")) {
		reasons.push(`Namespaces cannot contain slashes.`);
	}

	if (namespacedId.match(illegalCharacters)) {
		if (namespacedId.toLowerCase() !== namespacedId) {
			reasons.push(`Namespaced ids cannot contain uppercase characters.`);
		} else {
			reasons.push(`Namespaced id contains illegal characters.`);
		}
	}

	if (!reasons.length) return;
	return `"${namespacedId}" is not a valid namespaced id.\n` + reasons.join("\n");
}