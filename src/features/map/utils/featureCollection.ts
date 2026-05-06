import type {
  FeatureCollection,
  GeoJsonProperties,
} from "geojson";

import type { MapObject, SupportedGeometry } from "../../../shared/types/MapObject";

import type { MapObjectFeature } from "../types/mapTypes";

export function createObjectFeatureCollection(
  objects: MapObject[],
): FeatureCollection<SupportedGeometry, GeoJsonProperties> {
  return {
    type: "FeatureCollection",
    features: objects.map<MapObjectFeature>((object, index, sortedObjects) => ({
      type: "Feature",
      geometry: object.geometry,
      properties: {
        id: object.id,
        name: object.name,
        description: object.description,
        imageUrl: object.imageUrl,
        color: object.color,
        order: object.order,
        renderOrder: sortedObjects.length - index,
      },
    })),
  };
}