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
  geometry: SupportedGeometry | MultiPolygon
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPopupHtml(properties: GeoJsonProperties | null | undefined): string {
  const name =
    typeof properties?.name === "string" && properties.name.trim()
      ? properties.name
      : "Unnamed object";

  const description =
    typeof properties?.description === "string" ? properties.description : "";

  const imageUrl =
    typeof properties?.imageUrl === "string" ? properties.imageUrl : "";

  const safeName = escapeHtml(name);
  const safeDescription = escapeHtml(description);
  const safeImageUrl = escapeHtml(imageUrl);

  const imageSection = imageUrl
    ? `
      <img
        src="${safeImageUrl}"
        alt="${safeName}"
        style="width: 100%; max-width: 220px; border-radius: 8px; margin-top: 8px; display: block;"
        onerror="this.style.display='none';"
      />
    `
    : "";

  const descriptionSection = description
    ? `<p style="margin: 8px 0 0; font-size: 14px; line-height: 1.4;">${safeDescription}</p>`
    : `<p style="margin: 8px 0 0; font-size: 14px; color: #666;">No description</p>`;

  return `
    <div style="min-width: 200px; max-width: 240px;">
      <div style="font-weight: 700; font-size: 16px;">${safeName}</div>
      ${descriptionSection}
      ${imageSection}
    </div>
  `;
}

function getPopupLngLat(
  feature: maplibregl.MapGeoJSONFeature,
  clickLngLat: maplibregl.LngLat
): maplibregl.LngLatLike {
  if (feature.geometry.type === "Point") {
    return feature.geometry.coordinates as [number, number];
  }

  return clickLngLat;
}

export function MapView({ objects, onGeometryCreated }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

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
    [objects]
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
          geometryCandidate as SupportedGeometry | MultiPolygon
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

      const clickableLayerIds = [POINT_LAYER_ID, LINE_LAYER_ID, POLYGON_LAYER_ID] as const;

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

    const source = map.getSource(
      OBJECTS_SOURCE_ID
    ) as maplibregl.GeoJSONSource | undefined;

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