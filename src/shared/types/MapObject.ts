import type { Point, LineString, Polygon } from "geojson";

export type SupportedGeometry = Point | LineString | Polygon;

export type MapObject = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  color: string;
  geometry: SupportedGeometry;
  order: number;
};