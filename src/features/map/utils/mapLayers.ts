import type maplibregl from "maplibre-gl";
import type { FeatureCollection, GeoJsonProperties } from "geojson";

import type { SupportedGeometry } from "../../../shared/types/MapObject";

export const OBJECTS_SOURCE_ID = "objects-source";
export const POINT_LAYER_ID = "objects-points-layer";
export const LINE_LAYER_ID = "objects-lines-layer";
export const POLYGON_LAYER_ID = "objects-polygons-layer";

export const CLICKABLE_LAYER_IDS = [
  POINT_LAYER_ID,
  LINE_LAYER_ID,
  POLYGON_LAYER_ID,
] as const;

export function addObjectsSource(map: maplibregl.Map): void {
  if (map.getSource(OBJECTS_SOURCE_ID)) return;

  map.addSource(OBJECTS_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });
}

export function addObjectLayers(map: maplibregl.Map): void {
  if (!map.getLayer(POLYGON_LAYER_ID)) {
    map.addLayer({
      id: POLYGON_LAYER_ID,
      type: "fill",
      source: OBJECTS_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Polygon"],
      layout: {
        "fill-sort-key": ["get", "renderOrder"],
      },
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#3388ff"],
        "fill-opacity": 0.4,
      },
    });
  }

  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: OBJECTS_SOURCE_ID,
      filter: ["==", ["geometry-type"], "LineString"],
      layout: {
        "line-sort-key": ["get", "renderOrder"],
      },
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#3388ff"],
        "line-width": 4,
      },
    });
  }

  if (!map.getLayer(POINT_LAYER_ID)) {
    map.addLayer({
      id: POINT_LAYER_ID,
      type: "circle",
      source: OBJECTS_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Point"],
      layout: {
        "circle-sort-key": ["get", "renderOrder"],
      },
      paint: {
        "circle-color": ["coalesce", ["get", "color"], "#3388ff"],
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
}

export function updateObjectsSourceData(
  map: maplibregl.Map,
  featureCollection: FeatureCollection<SupportedGeometry, GeoJsonProperties>,
): void {
  const source = map.getSource(OBJECTS_SOURCE_ID) as
    | maplibregl.GeoJSONSource
    | undefined;

  if (!source) return;

  source.setData(featureCollection);
}