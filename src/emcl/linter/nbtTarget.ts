import * as namespacedId from "./namespacedId";

export function lint(kind: string, target: string) {
	if (kind === "storage") return namespacedId.lint(target);

	if (kind === "entity") {
		if (target === "@a" || target === "@e") {
			return `nbt "entity" ${JSON.stringify(target)} is not a valid NBT target as it affects multiple entities.\n` + _multiTargetWarning;
		}
	}

	return undefined;
}

const _multiTargetWarning = `To affect a single target, use a different selector or add a clause. For example:
nbt "entity" "@p" ...
nbt "entity" "@e[limit=1]" ...

To affect multiple entities, use an execute-block and the self-selector (@s). For example:
execute "as @e" {
	nbt "entity" "@s" ...
}`;