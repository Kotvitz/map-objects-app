import type { MapObject, SupportedGeometry } from "../types/MapObject";
import type { ObjectFormValues } from "../features/objects/ObjectFormModal";

const BASE_URL = "/api/objects";

type CreateMapObjectInput = ObjectFormValues & {
  geometry: SupportedGeometry;
};

export async function getObjects(): Promise<MapObject[]> {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch objects");
  }

  return response.json() as Promise<MapObject[]>;
}

export async function createObject(
  input: CreateMapObjectInput
): Promise<MapObject> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create object");
  }

  return response.json() as Promise<MapObject>;
}

export async function updateObject(
  id: string,
  input: ObjectFormValues
): Promise<MapObject> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to update object");
  }

  return response.json() as Promise<MapObject>;
}

export async function deleteObject(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete object");
  }
}