import { useCallback, useMemo, useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  IconGripVertical,
  IconMapPin,
  IconPencil,
  IconPlus,
  IconPolygon,
  IconSlash,
  IconTrash,
} from "@tabler/icons-react";

import { Layout } from "./components/layout/Layout";
import { MapView } from "./features/map/MapView";

import {
  ObjectFormModal,
  type ObjectFormValues,
} from "./features/objects/ObjectFormModal";

import {
  createObject,
  deleteObject,
  getObjects,
  reorderObjects,
  updateObject,
} from "./services/objectApi";

import type {
  MapObject,
  SupportedGeometry,
} from "./types/MapObject";

const OBJECTS_QUERY_KEY = ["objects"];

type DrawMode = "point" | "line" | "polygon";

type SortableObjectItemProps = {
  object: MapObject;
  onFocus: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function SortableObjectItem({
  object,
  onFocus,
  onEdit,
  onDelete,
}: SortableObjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: object.id,
  });

  return (
    <Group
      ref={setNodeRef}
      justify="space-between"
      wrap="nowrap"
      p="xs"
      style={{
        border: "1px solid #e9ecef",
        borderRadius: 8,
        background: "#fff",
        opacity: isDragging ? 0.6 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
        <ActionIcon
          variant="subtle"
          color="gray"
          {...attributes}
          {...listeners}
        >
          <IconGripVertical size={16} />
        </ActionIcon>

        <UnstyledButton
          onClick={() => onFocus(object.id)}
          style={{ flex: 1 }}
        >
          <Stack gap={2}>
            <Text fw={500}>
              {object.name}
            </Text>
          </Stack>
        </UnstyledButton>
      </Group>

      <Group gap="xs">
        <ActionIcon
          color="blue"
          variant="light"
          onClick={() => onEdit(object.id)}
        >
          <IconPencil size={16} />
        </ActionIcon>

        <ActionIcon
          color="red"
          variant="light"
          onClick={() => onDelete(object.id)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Group>
  );
}

function App() {
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const [pendingGeometry, setPendingGeometry] =
    useState<SupportedGeometry | null>(null);

  const [formOpened, setFormOpened] =
    useState(false);

  const [formMode, setFormMode] =
    useState<"create" | "edit">("create");

  const [editingObjectId, setEditingObjectId] =
    useState<string | null>(null);

  const [focusRequest, setFocusRequest] =
    useState<{
      objectId: string;
      requestId: number;
    } | null>(null);

  const [activeDrawMode, setActiveDrawMode] =
    useState<DrawMode | null>(null);

  const {
    data: objects = [],
    isLoading,
    isError,
  } = useQuery<MapObject[]>({
    queryKey: OBJECTS_QUERY_KEY,
    queryFn: getObjects,
  });

  const sortedObjects = useMemo(
    () =>
      [...objects].sort(
        (a, b) => a.order - b.order
      ),
    [objects]
  );

  const createMutation = useMutation({
    mutationFn: createObject,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OBJECTS_QUERY_KEY,
      });

      setFormOpened(false);
      setPendingGeometry(null);
      setEditingObjectId(null);
      setActiveDrawMode(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: ObjectFormValues;
    }) =>
      updateObject(id, values),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OBJECTS_QUERY_KEY,
      });

      setFormOpened(false);
      setEditingObjectId(null);
      setActiveDrawMode(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObject,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OBJECTS_QUERY_KEY,
      });

      setEditingObjectId(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderObjects,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OBJECTS_QUERY_KEY,
      });
    },
  });

  const handleStartDraw = (
    mode: DrawMode
  ) => {
    setPendingGeometry(null);
    setEditingObjectId(null);
    setFormMode("create");
    setFormOpened(false);
    setActiveDrawMode(mode);
  };

  const handleGeometryCreated =
    useCallback(
      (geometry: SupportedGeometry) => {
        setPendingGeometry(geometry);
        setFormMode("create");
        setFormOpened(true);
        setActiveDrawMode(null);
      },
      []
    );

  const handleSubmitForm = (
    values: ObjectFormValues
  ) => {
    if (
      formMode === "create" &&
      pendingGeometry
    ) {
      createMutation.mutate({
        ...values,
        geometry: pendingGeometry,
      });

      return;
    }

    if (
      formMode === "edit" &&
      editingObjectId
    ) {
      updateMutation.mutate({
        id: editingObjectId,
        values,
      });
    }
  };

  const handleDeleteObject = (
    id: string
  ) => {
    deleteMutation.mutate(id);
  };

  const handleEditObject = (
    id: string
  ) => {
    setEditingObjectId(id);
    setFormMode("edit");
    setFormOpened(true);
  };

  const handleFocusObject = (
    id: string
  ) => {
    setFocusRequest({
      objectId: id,
      requestId: Date.now(),
    });
  };

  const handleDragEnd = (
    event: DragEndEvent
  ) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id === over.id) return;

    const oldIndex =
      sortedObjects.findIndex(
        (o) => o.id === active.id
      );

    const newIndex =
      sortedObjects.findIndex(
        (o) => o.id === over.id
      );

    const reordered = arrayMove(
      sortedObjects,
      oldIndex,
      newIndex
    );

    reorderMutation.mutate(
      reordered.map((o) => o.id)
    );
  };

  const editingObject =
    objects.find(
      (o) => o.id === editingObjectId
    ) ?? null;

  return (
    <>
      <Layout
        sidebar={
          <Stack>

            <Text fw={700}>
              List
            </Text>

            {isLoading ? (
              <Loader size="sm" />
            ) : isError ? (
              <Text c="red">
                Failed to load
              </Text>
            ) : sortedObjects.length === 0 ? (
              <Text c="dimmed">
                No objects yet
              </Text>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={
                  closestCenter
                }
                onDragEnd={
                  handleDragEnd
                }
              >
                <SortableContext
                  items={sortedObjects.map(
                    (o) => o.id
                  )}
                  strategy={
                    verticalListSortingStrategy
                  }
                >
                  <Stack gap="xs">
                    {sortedObjects.map(
                      (object) => (
                        <SortableObjectItem
                          key={
                            object.id
                          }
                          object={
                            object
                          }
                          onFocus={
                            handleFocusObject
                          }
                          onEdit={
                            handleEditObject
                          }
                          onDelete={
                            handleDeleteObject
                          }
                        />
                      )
                    )}
                  </Stack>
                </SortableContext>
              </DndContext>
            )}

            <Menu>

              <Menu.Target>
                <Button
                  variant="subtle"
                  justify="flex-start"
                  leftSection={
                    <IconPlus size={18} />
                  }
                >
                  Add Object
                </Button>
              </Menu.Target>

              <Menu.Dropdown>

                <Menu.Item
                  leftSection={
                    <IconMapPin size={16} />
                  }
                  onClick={() =>
                    handleStartDraw("point")
                  }
                >
                  Point
                </Menu.Item>

                <Menu.Item
                  leftSection={
                    <IconSlash size={16} />
                  }
                  onClick={() =>
                    handleStartDraw("line")
                  }
                >
                  Line
                </Menu.Item>

                <Menu.Item
                  leftSection={
                    <IconPolygon size={16} />
                  }
                  onClick={() =>
                    handleStartDraw("polygon")
                  }
                >
                  Polygon
                </Menu.Item>

              </Menu.Dropdown>

            </Menu>

          </Stack>
        }

        map={
          <MapView
            objects={sortedObjects}
            focusRequest={
              focusRequest
            }
            activeDrawMode={
              activeDrawMode
            }
            onGeometryCreated={
              handleGeometryCreated
            }
          />
        }
      />

      <ObjectFormModal
        opened={formOpened}
        mode={formMode}
        initialValues={
          editingObject
            ? {
                name:
                  editingObject.name,
                description:
                  editingObject.description ??
                  "",
                imageUrl:
                  editingObject.imageUrl ??
                  "",
                color:
                  editingObject.color,
              }
            : undefined
        }
        onClose={() =>
          setFormOpened(false)
        }
        onSubmit={handleSubmitForm}
        submitting={
          createMutation.isPending ||
          updateMutation.isPending
        }
      />
    </>
  );
}

export default App;