import maplibregl from "maplibre-gl";
import type { MultiPolygon, Position } from "geojson";
import type { MapObject, SupportedGeometry } from "../../../shared/types/MapObject";

export function normalizeGeometry(
  geometry: SupportedGeometry | MultiPolygon,
): SupportedGeometry | null {
  if (
    geometry.type === "Point" ||
    geometry.type === "LineString" ||
    geometry.type === "Polygon"
  ) {
    return geometry;
  }

  if (geometry.type === "MultiPolygon" && geometry.coordinates.length === 1) {
    return {
      type: "Polygon",
      coordinates: geometry.coordinates[0],
    };
  }

  return null;
}

export function collectCoordinates(
  geometry: SupportedGeometry,
): [number, number][] {
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    return [[lng, lat]];
  }

if (geometry.type === "LineString") {
  return geometry.coordinates.map((position: Position): [number, number] => {
    const [lng, lat] = position;
    return [lng, lat];
  });
}

  return geometry.coordinates.flat().map((position: Position) => {
    const [lng, lat] = position;
    return [lng, lat];
  });
}

export function flyToObject(
  map: maplibregl.Map,
  object: MapObject,
): void {
  const coordinates = collectCoordinates(object.geometry);

  if (coordinates.length === 0) return;

  if (object.geometry.type === "Point") {
    const [lng, lat] = coordinates[0];

    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      essential: true,
    });

    return;
  }

  const bounds = coordinates.reduce(
    (accumulator, [lng, lat]) => accumulator.extend([lng, lat]),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
  );

  map.fitBounds(bounds, {
    padding: 60,
    maxZoom: 15,
    duration: 800,
  });
}