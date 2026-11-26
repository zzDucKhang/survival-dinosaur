import rawSpecies from "../../../shared/species.json";
import type { DinoSpec } from "../types";

const speciesList = rawSpecies as DinoSpec[];

export const DINOSAURS: Record<string, DinoSpec> = Object.fromEntries(
  speciesList.map((s) => [s.id.toLowerCase(), s]),
);

export const DINO_LIST: DinoSpec[] = speciesList;

export function getDinoSpec(modelId?: string): DinoSpec {
  if (modelId) {
    const found = DINOSAURS[modelId.toLowerCase()];
    if (found) return found;
  }
  return DINOSAURS["trex"] || speciesList[0];
}
