import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Geoman, type GmOptionsPartial } from "@geoman-io/maplibre-geoman-free";
import type { MultiPolygon } from "geojson";
import type {
  MapObject,
  SupportedGeometry,
} from "../../shared/types/MapObject";

import type { DrawMode } from "../../shared/types/DrawMode";

import "maplibre-gl/dist/maplibre-gl.css";
import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";

import { buildPopupHtml, getPopupLngLat } from "./utils/popup";
import { createObjectFeatureCollection } from "./utils/featureCollection";
import { flyToObject, normalizeGeometry } from "./utils/geometry";

import {
  addObjectLayers,
  addObjectsSource,
  CLICKABLE_LAYER_IDS,
  updateObjectsSourceData,
} from "./utils/mapLayers";

type Props = {
  objects: MapObject[];
  focusRequest: {
    objectId: string;
    requestId: number;
  } | null;
  activeDrawMode: DrawMode | null;
  onGeometryCreated: (geometry: SupportedGeometry) => void;
};

type GeomanMap = maplibregl.Map & {
  gm?: {
    enableDraw: (shape: "marker" | "line" | "polygon") => void;
    disableDraw: () => void;
  };
};

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

      addObjectsSource(map);
      addObjectLayers(map);

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

      CLICKABLE_LAYER_IDS.forEach((layerId) => {
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

    updateObjectsSourceData(map, featureCollection);
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