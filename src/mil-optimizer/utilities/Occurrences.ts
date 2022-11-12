import * as mil from "mil";
import { ReadonlyStoreMap, StoreMap } from "./StoreMap.js";

export type ReadonlyOccurrences = ReadonlyStoreMap<number>;
export type Occurrences = StoreMap<number>;
export namespace Occurrences {
	export function get(program: mil.Program) {
		const out: Occurrences = new StoreMap;
		for (const [blockName, block] of program.branches) {
			for (const instruction of block) {
				if (instruction instanceof mil.MCCommand) {
					continue;
				}

				if (instruction instanceof mil.Goto) {
					for (const subcommand of instruction.subcommands) {
						if (subcommand instanceof mil.MCSubcommand) continue;

						const references = mil.Value.getReferences(subcommand);
						for (const reference of references) {
							out.set(reference, (out.get(reference) || 0) + 1);
						}
					}
					continue;
				}

				if (instruction instanceof mil.Assignment) {
					const references = mil.Value.getReferences(instruction.rhs);
					for (const reference of references) {
						out.set(reference, (out.get(reference) || 0) + 1);
					}
					continue;
				}

				assertUnreachable(instruction);
			}
		}
		return out;
	}
}

function assertUnreachable(x: never): never {
    throw new Error("Optimizer: Unexpected error");
}