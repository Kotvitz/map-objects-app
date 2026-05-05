import {
  Button,
  Loader,
  Menu,
  Stack,
  Text,
} from "@mantine/core";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  IconMapPin,
  IconPlus,
  IconPolygon,
  IconSlash,
} from "@tabler/icons-react";

import { SortableObjectItem } from "./SortableObjectItem";

import type { DrawMode } from "../../../shared/types/DrawMode";
import type { MapObject } from "../../../shared/types/MapObject";

type ObjectSidebarProps = {
  objects: MapObject[];
  isLoading: boolean;
  isError: boolean;
  onStartDraw: (mode: DrawMode) => void;
  onFocusObject: (id: string) => void;
  onEditObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
};

export function ObjectSidebar({
  objects,
  isLoading,
  isError,
  onStartDraw,
  onFocusObject,
  onEditObject,
  onDeleteObject,
  onDragEnd,
}: ObjectSidebarProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <Stack>
      <Text fw={700}>List</Text>

      {isLoading ? (
        <Loader size="sm" />
      ) : isError ? (
        <Text c="red">Failed to load</Text>
      ) : objects.length === 0 ? (
        <Text c="dimmed">No objects yet</Text>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={objects.map((object) => object.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack gap="xs">
              {objects.map((object) => (
                <SortableObjectItem
                  key={object.id}
                  object={object}
                  onFocus={onFocusObject}
                  onEdit={onEditObject}
                  onDelete={onDeleteObject}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}

      <Menu>
        <Menu.Target>
          <Button
            variant="subtle"
            justify="flex-start"
            leftSection={<IconPlus size={18} />}
          >
            Add Object
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconMapPin size={16} />}
            onClick={() => onStartDraw("point")}
          >
            Point
          </Menu.Item>

          <Menu.Item
            leftSection={<IconSlash size={16} />}
            onClick={() => onStartDraw("line")}
          >
            Line
          </Menu.Item>

          <Menu.Item
            leftSection={<IconPolygon size={16} />}
            onClick={() => onStartDraw("polygon")}
          >
            Polygon
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Stack>
  );
}