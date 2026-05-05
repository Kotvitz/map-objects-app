import type { MapObject } from "../shared/types/MapObject";

export let mockObjects: MapObject[] = [];

export function getMockObjects(): MapObject[] {
  return structuredClone(mockObjects);
}

export function setMockObjects(nextObjects: MapObject[]): void {
  mockObjects = structuredClone(nextObjects);
}

export function resetMockObjects(): void {
  mockObjects = [];
}