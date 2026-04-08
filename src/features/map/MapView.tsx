import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Geoman, type GmOptionsPartial } from "@geoman-io/maplibre-geoman-free";
import type { SupportedGeometry } from "../../types/MapObject";

import "maplibre-gl/dist/maplibre-gl.css";
import "@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css";

type Props = {
  onGeometryCreated: (geometry: SupportedGeometry) => void;
};

export function MapView({ onGeometryCreated }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

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
        };
      };

      const geometryCandidate = candidate.feature?.getGeoJson?.().geometry;

      if (!geometryCandidate) return;

      if (
        typeof geometryCandidate === "object" &&
        geometryCandidate !== null &&
        "type" in geometryCandidate
      ) {
        const geometry = geometryCandidate as SupportedGeometry;

        if (
          geometry.type === "Point" ||
          geometry.type === "LineString" ||
          geometry.type === "Polygon"
        ) {
          onGeometryCreated(geometry);
        }
      }
    });

    map.on("load", () => {
      map.resize();
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
