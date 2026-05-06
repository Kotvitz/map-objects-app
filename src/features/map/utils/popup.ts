import type maplibregl from "maplibre-gl";
import type { GeoJsonProperties } from "geojson";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildPopupHtml(
  properties: GeoJsonProperties | null | undefined,
): string {
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

  const descriptionSection = `<p style="margin: 8px 0 0; font-size: 14px; line-height: 1.4;">${safeDescription}</p>`;

  return `
    <div style="min-width: 200px; max-width: 240px;">
      <div style="font-weight: 700; font-size: 16px;">${safeName}</div>
      ${descriptionSection}
      ${imageSection}
    </div>
  `;
}

export function getPopupLngLat(
  feature: maplibregl.MapGeoJSONFeature,
  clickLngLat: maplibregl.LngLat,
): maplibregl.LngLatLike {
  if (feature.geometry.type === "Point") {
    return feature.geometry.coordinates as [number, number];
  }

  return clickLngLat;
}