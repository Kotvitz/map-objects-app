import { http, HttpResponse } from "msw";
import type { MapObject } from "../shared/types/MapObject";
import { getMockObjects, setMockObjects } from "./data";

const BASE_URL = "/api/objects";

type CreateMapObjectBody = Omit<MapObject, "id" | "order">;
type UpdateMapObjectBody = Pick<
  MapObject,
  "name" | "description" | "imageUrl" | "color"
>;
type ReorderObjectsBody = {
  orderedIds: string[];
};

export const handlers = [
  http.get(BASE_URL, () => {
    const objects = getMockObjects().sort((a, b) => a.order - b.order);
    return HttpResponse.json(objects);
  }),

  http.post(BASE_URL, async ({ request }) => {
    const body = (await request.json()) as CreateMapObjectBody;
    const currentObjects = getMockObjects().sort((a, b) => a.order - b.order);

    const newObject: MapObject = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description,
      imageUrl: body.imageUrl,
      color: body.color,
      geometry: body.geometry,
      order: currentObjects.length,
    };

    const nextObjects = [...currentObjects, newObject];
    setMockObjects(nextObjects);

    return HttpResponse.json(newObject, { status: 201 });
  }),

  http.patch(`${BASE_URL}/reorder`, async ({ request }) => {
    const body = (await request.json()) as ReorderObjectsBody;
    const currentObjects = getMockObjects();

    const objectMap = new Map(currentObjects.map((object) => [object.id, object]));
    const reorderedObjects = body.orderedIds
      .map((id) => objectMap.get(id))
      .filter((object): object is MapObject => Boolean(object))
      .map((object, index) => ({
        ...object,
        order: index,
      }));

    setMockObjects(reorderedObjects);

    return HttpResponse.json(reorderedObjects);
  }),

  http.put(`${BASE_URL}/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as UpdateMapObjectBody;
    const currentObjects = getMockObjects();

    const existingObject = currentObjects.find((object) => object.id === id);

    if (!existingObject) {
      return HttpResponse.json({ message: "Object not found" }, { status: 404 });
    }

    const updatedObject: MapObject = {
      ...existingObject,
      name: body.name,
      description: body.description,
      imageUrl: body.imageUrl,
      color: body.color,
    };

    const nextObjects = currentObjects.map((object) =>
      object.id === id ? updatedObject : object
    );

    setMockObjects(nextObjects);

    return HttpResponse.json(updatedObject);
  }),

  http.delete(`${BASE_URL}/:id`, ({ params }) => {
    const { id } = params;
    const currentObjects = getMockObjects();

    const nextObjects = currentObjects
      .filter((object) => object.id !== id)
      .map((object, index) => ({
        ...object,
        order: index,
      }));

    setMockObjects(nextObjects);

    return new HttpResponse(null, { status: 204 });
  }),
];