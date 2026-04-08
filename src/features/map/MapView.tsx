import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Geoman, type GmOptionsPartial } from "@geoman-io/maplibre-geoman-free";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
} from "geojson";
import type { MapObject, SupportedGeometry } from "../../types/MapObject";

import "maplibre-gl/dist/maplibre-gl.css";
import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";

type Props = {
  objects: MapObject[];
  onGeometryCreated: (geometry: SupportedGeometry) => void;
};

const OBJECTS_SOURCE_ID = "objects-source";
const POINT_LAYER_ID = "objects-points-layer";
const LINE_LAYER_ID = "objects-lines-layer";
const POLYGON_LAYER_ID = "objects-polygons-layer";

type MapObjectFeature = Feature<SupportedGeometry, GeoJsonProperties>;

function normalizeGeometry(
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

export function MapView({ objects, onGeometryCreated }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const featureCollection = useMemo<
    FeatureCollection<SupportedGeometry, GeoJsonProperties>
  >(
    () => ({
      type: "FeatureCollection",
      features: objects.map<MapObjectFeature>((object) => ({
        type: "Feature",
        geometry: object.geometry,
        properties: {
          id: object.id,
          name: object.name,
          description: object.description,
          imageUrl: object.imageUrl,
          color: object.color,
          order: object.order,
        },
      })),
    }),
    [objects],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [19.1451, 51.9194],
      zoom: 5,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const gmOptions: GmOptionsPartial = {
      settings: {
        controlsPosition: "top-left",
      },
      controls: {
        draw: {
          marker: { uiEnabled: true },
          line: { uiEnabled: true },
          polygon: { uiEnabled: true },
          circle: { uiEnabled: false },
          circle_marker: { uiEnabled: false },
          ellipse: { uiEnabled: false },
          text_marker: { uiEnabled: false },
          rectangle: { uiEnabled: false },
          freehand: { uiEnabled: false },
          custom_shape: { uiEnabled: false },
        },
        edit: {
          drag: { uiEnabled: false },
          cut: { uiEnabled: false },
          change: { uiEnabled: false },
          rotate: { uiEnabled: false },
          scale: { uiEnabled: false },
          split: { uiEnabled: false },
          union: { uiEnabled: false },
          difference: { uiEnabled: false },
          copy: { uiEnabled: false },
          line_simplification: { uiEnabled: false },
          delete: { uiEnabled: false },
        },
        helper: {
          snapping: { uiEnabled: false },
          zoom_to_features: { uiEnabled: false },
        },
      },
    };

    new Geoman(map, gmOptions);

    map.on("gm:create" as never, (event: unknown) => {
      const candidate = event as {
        feature?: {
          getGeoJson?: () => {
            geometry?: unknown;
          };
          delete?: () => void;
        };
      };

      const geometryCandidate = candidate.feature?.getGeoJson?.().geometry;

      if (!geometryCandidate) return;

      if (
        typeof geometryCandidate === "object" &&
        geometryCandidate !== null &&
        "type" in geometryCandidate
      ) {
        const normalizedGeometry = normalizeGeometry(
          geometryCandidate as SupportedGeometry | MultiPolygon,
        );

        if (!normalizedGeometry) return;

        onGeometryCreated(normalizedGeometry);
        candidate.feature?.delete?.();
      }
    });

    map.on("load", () => {
      map.resize();

      map.addSource(OBJECTS_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: POLYGON_LAYER_ID,
        type: "fill",
        source: OBJECTS_SOURCE_ID,
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#3388ff"],
          "fill-opacity": 0.4,
        },
      });

      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: OBJECTS_SOURCE_ID,
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": ["coalesce", ["get", "color"], "#3388ff"],
          "line-width": 4,
        },
      });

      map.addLayer({
        id: POINT_LAYER_ID,
        type: "circle",
        source: OBJECTS_SOURCE_ID,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-color": ["coalesce", ["get", "color"], "#3388ff"],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    mapRef.current = map;

    const handleResize = () => {
      map.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, [onGeometryCreated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource(OBJECTS_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;

    if (!source) return;

    source.setData(featureCollection);
  }, [featureCollection]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
