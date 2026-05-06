import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Geoman, type GmOptionsPartial } from "@geoman-io/maplibre-geoman-free";
import type {
  MultiPolygon,
  Position,
} from "geojson";
import type {
  MapObject,
  SupportedGeometry,
} from "../../shared/types/MapObject";

import type { DrawMode } from "../../shared/types/DrawMode";

import "maplibre-gl/dist/maplibre-gl.css";
import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";

import { buildPopupHtml, getPopupLngLat } from "./utils/popup";
import { createObjectFeatureCollection } from "./utils/featureCollection";

type Props = {
  objects: MapObject[];
  focusRequest: {
    objectId: string;
    requestId: number;
  } | null;
  activeDrawMode: DrawMode | null;
  onGeometryCreated: (geometry: SupportedGeometry) => void;
};

const OBJECTS_SOURCE_ID = "objects-source";
const POINT_LAYER_ID = "objects-points-layer";
const LINE_LAYER_ID = "objects-lines-layer";
const POLYGON_LAYER_ID = "objects-polygons-layer";

type GeomanMap = maplibregl.Map & {
  gm?: {
    enableDraw: (shape: "marker" | "line" | "polygon") => void;
    disableDraw: () => void;
  };
};

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

function collectCoordinates(geometry: SupportedGeometry): [number, number][] {
  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    return [[lng, lat]];
  }

  if (geometry.type === "LineString") {
    return geometry.coordinates.map(([lng, lat]) => [lng, lat]);
  }

  return geometry.coordinates.flat().map((position: Position) => {
    const [lng, lat] = position;
    return [lng, lat];
  });
}

function flyToObject(map: maplibregl.Map, object: MapObject) {
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

export function MapView({
  objects,
  focusRequest,
  activeDrawMode,
  onGeometryCreated,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const featureCollection = useMemo(
    () => createObjectFeatureCollection(objects),
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
          marker: { uiEnabled: false },
          line: { uiEnabled: false },
          polygon: { uiEnabled: false },
        },
      },
    };

    const gm = new Geoman(map, gmOptions);

    map.on("gm:loaded", () => {
      gm.removeControls();
    });

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

        const gmMap = map as GeomanMap;
        gmMap.gm?.disableDraw();
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
        layout: {
          "fill-sort-key": ["get", "renderOrder"],
        },
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
        layout: {
          "line-sort-key": ["get", "renderOrder"],
        },
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

      const clickableLayerIds = [
        POINT_LAYER_ID,
        LINE_LAYER_ID,
        POLYGON_LAYER_ID,
      ] as const;

      const handleFeatureClick = (event: maplibregl.MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature) return;

        popupRef.current?.remove();

        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "260px",
        })
          .setLngLat(getPopupLngLat(feature, event.lngLat))
          .setHTML(buildPopupHtml(feature.properties))
          .addTo(map);
      };

      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = "pointer";
      };

      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = "";
      };

      clickableLayerIds.forEach((layerId) => {
        map.on("click", layerId, handleFeatureClick);
        map.on("mouseenter", layerId, handleMouseEnter);
        map.on("mouseleave", layerId, handleMouseLeave);
      });
    });

    mapRef.current = map;

    const handleResize = () => {
      map.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      popupRef.current?.remove();
      popupRef.current = null;
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

  useEffect(() => {
    if (!focusRequest) return;

    const map = mapRef.current;
    if (!map) return;

    const selectedObject = objects.find(
      (object) => object.id === focusRequest.objectId,
    );

    if (!selectedObject) return;

    flyToObject(map, selectedObject);
  }, [objects, focusRequest]);

  useEffect(() => {
    const map = mapRef.current as GeomanMap | null;
    if (!map?.gm) return;

    map.gm.disableDraw();

    if (activeDrawMode === "point") {
      map.gm.enableDraw("marker");
    } else if (activeDrawMode === "line") {
      map.gm.enableDraw("line");
    } else if (activeDrawMode === "polygon") {
      map.gm.enableDraw("polygon");
    }
  }, [activeDrawMode]);

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