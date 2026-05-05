// src/features/objects/hooks/useObjects.ts

import { useQuery } from "@tanstack/react-query";
import { getObjects } from "../../../services/objectApi";
import type { MapObject } from "../../../shared/types/MapObject";

export function useObjects() {
  return useQuery<MapObject[]>({
    queryKey: ["objects"],
    queryFn: getObjects,
    select: (objects) =>
      [...objects].sort((a, b) => a.order - b.order),
  });
}