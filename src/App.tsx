import { useCallback, useMemo, useState } from "react";
import {
  ActionIcon,
  Group,
  Loader,
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
import { IconGripVertical, IconPencil, IconTrash } from "@tabler/icons-react";
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
import type { MapObject, SupportedGeometry } from "./types/MapObject";

const OBJECTS_QUERY_KEY = ["objects"];

type SortableObjectItemProps = {
  object: MapObject;
  onFocus: (objectId: string) => void;
  onEdit: (objectId: string) => void;
  onDelete: (objectId: string) => void;
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
  } = useSortable({ id: object.id });

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
      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={`Reorder ${object.name}`}
          {...attributes}
          {...listeners}
          style={{ cursor: "grab" }}
        >
          <IconGripVertical size={16} />
        </ActionIcon>

        <UnstyledButton
          onClick={() => onFocus(object.id)}
          style={{ minWidth: 0, flex: 1 }}
        >
          <Stack gap={2}>
            <Text fw={500} truncate>
              {object.name}
            </Text>
          </Stack>
        </UnstyledButton>
      </Group>

      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          color="blue"
          variant="light"
          aria-label={`Edit ${object.name}`}
          onClick={() => onEdit(object.id)}
        >
          <IconPencil size={16} />
        </ActionIcon>

        <ActionIcon
          color="red"
          variant="light"
          aria-label={`Delete ${object.name}`}
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
  const sensors = useSensors(useSensor(PointerSensor));

  const [pendingGeometry, setPendingGeometry] =
    useState<SupportedGeometry | null>(null);
  const [formOpened, setFormOpened] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    objectId: string;
    requestId: number;
  } | null>(null);

  const {
    data: objects = [],
    isLoading,
    isError,
  } = useQuery<MapObject[]>({
    queryKey: OBJECTS_QUERY_KEY,
    queryFn: getObjects,
  });

  const sortedObjects = useMemo(
    () => [...objects].sort((a, b) => a.order - b.order),
    [objects]
  );

  const createObjectMutation = useMutation({
    mutationFn: createObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OBJECTS_QUERY_KEY });
      setFormOpened(false);
      setPendingGeometry(null);
      setEditingObjectId(null);
      setFormMode("create");
    },
  });

  const updateObjectMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ObjectFormValues }) =>
      updateObject(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OBJECTS_QUERY_KEY });
      setFormOpened(false);
      setEditingObjectId(null);
      setFormMode("create");
    },
  });

  const deleteObjectMutation = useMutation({
    mutationFn: deleteObject,
    onSuccess: (_, deletedObjectId) => {
      queryClient.invalidateQueries({ queryKey: OBJECTS_QUERY_KEY });

      setFocusRequest((currentFocusRequest) =>
        currentFocusRequest?.objectId === deletedObjectId
          ? null
          : currentFocusRequest
      );

      setEditingObjectId((currentEditingId) =>
        currentEditingId === deletedObjectId ? null : currentEditingId
      );
    },
  });

  const reorderObjectsMutation = useMutation({
    mutationFn: reorderObjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OBJECTS_QUERY_KEY });
    },
  });

  const handleGeometryCreated = useCallback((geometry: SupportedGeometry) => {
    setPendingGeometry(geometry);
    setEditingObjectId(null);
    setFormMode("create");
    setFormOpened(true);
  }, []);

  const handleCloseForm = () => {
    setFormOpened(false);
    setPendingGeometry(null);
    setEditingObjectId(null);
    setFormMode("create");
  };

  const handleCreateObject = (values: ObjectFormValues) => {
    if (!pendingGeometry) return;

    createObjectMutation.mutate({
      ...values,
      geometry: pendingGeometry,
    });
  };

  const handleEditObject = (values: ObjectFormValues) => {
    if (!editingObjectId) return;

    updateObjectMutation.mutate({
      id: editingObjectId,
      values,
    });
  };

  const handleSubmitForm = (values: ObjectFormValues) => {
    if (formMode === "create") {
      handleCreateObject(values);
      return;
    }

    handleEditObject(values);
  };

  const handleStartEditObject = (objectId: string) => {
    setEditingObjectId(objectId);
    setPendingGeometry(null);
    setFormMode("edit");
    setFormOpened(true);
  };

  const handleDeleteObject = (objectId: string) => {
    deleteObjectMutation.mutate(objectId);
  };

  const handleFocusObject = (objectId: string) => {
    setFocusRequest({
      objectId,
      requestId: Date.now(),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedObjects.findIndex((object) => object.id === active.id);
    const newIndex = sortedObjects.findIndex((object) => object.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedObjects, oldIndex, newIndex);
    const orderedIds = reordered.map((object) => object.id);

    reorderObjectsMutation.mutate(orderedIds);
  };

  const editingObject = useMemo(
    () => objects.find((object) => object.id === editingObjectId) ?? null,
    [editingObjectId, objects]
  );

  const formInitialValues = useMemo<ObjectFormValues | undefined>(() => {
    if (formMode === "edit" && editingObject) {
      return {
        name: editingObject.name,
        description: editingObject.description ?? "",
        imageUrl: editingObject.imageUrl ?? "",
        color: editingObject.color,
      };
    }

    return undefined;
  }, [editingObject, formMode]);

  const isSubmitting =
    createObjectMutation.isPending || updateObjectMutation.isPending;

  return (
    <>
      <Layout
        sidebar={
          <Stack>
            <Text fw={700}>Objects</Text>

            {isLoading ? (
              <Group gap="xs">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Loading objects...
                </Text>
              </Group>
            ) : isError ? (
              <Text c="red" size="sm">
                Failed to load objects
              </Text>
            ) : sortedObjects.length === 0 ? (
              <Text c="dimmed" size="sm">
                No objects yet
              </Text>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedObjects.map((object) => object.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack gap="xs">
                    {sortedObjects.map((object) => (
                      <SortableObjectItem
                        key={object.id}
                        object={object}
                        onFocus={handleFocusObject}
                        onEdit={handleStartEditObject}
                        onDelete={handleDeleteObject}
                      />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>
            )}
          </Stack>
        }
        map={
          <MapView
            objects={sortedObjects}
            focusRequest={focusRequest}
            onGeometryCreated={handleGeometryCreated}
          />
        }
      />

      <ObjectFormModal
        opened={formOpened}
        mode={formMode}
        initialValues={formInitialValues}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        submitting={isSubmitting}
      />
    </>
  );
}

export default App;