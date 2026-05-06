import type {
  Feature,
  GeoJsonProperties,
} from "geojson";

import type { SupportedGeometry } from "../../../shared/types/MapObject";

export type MapObjectFeature = Feature<
  SupportedGeometry,
  GeoJsonProperties
>;