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
import { IconPencil, IconTrash } from "@tabler/icons-react";
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
  updateObject,
} from "./services/objectApi";
import type { SupportedGeometry } from "./types/MapObject";

const OBJECTS_QUERY_KEY = ["objects"];

function App() {
  const queryClient = useQueryClient();

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
  } = useQuery({
    queryKey: OBJECTS_QUERY_KEY,
    queryFn: getObjects,
  });

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
          : currentFocusRequest,
      );

      setEditingObjectId((currentEditingId) =>
        currentEditingId === deletedObjectId ? null : currentEditingId,
      );
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

  const editingObject = useMemo(
    () => objects.find((object) => object.id === editingObjectId) ?? null,
    [editingObjectId, objects],
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
            ) : objects.length === 0 ? (
              <Text c="dimmed" size="sm">
                No objects yet
              </Text>
            ) : (
              objects.map((object) => (
                <Group
                  key={object.id}
                  justify="space-between"
                  wrap="nowrap"
                  p="xs"
                  style={{
                    border: "1px solid #e9ecef",
                    borderRadius: 8,
                  }}
                >
                  <UnstyledButton
                    onClick={() =>
                      setFocusRequest({
                        objectId: object.id,
                        requestId: Date.now(),
                      })
                    }
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    <Stack gap={2}>
                      <Text fw={500} truncate>
                        {object.name}
                      </Text>
                    </Stack>
                  </UnstyledButton>

                  <Group gap="xs" wrap="nowrap">
                    <ActionIcon
                      color="blue"
                      variant="light"
                      aria-label={`Edit ${object.name}`}
                      onClick={() => handleStartEditObject(object.id)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>

                    <ActionIcon
                      color="red"
                      variant="light"
                      aria-label={`Delete ${object.name}`}
                      loading={deleteObjectMutation.isPending}
                      onClick={() => handleDeleteObject(object.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))
            )}
          </Stack>
        }
        map={
          <MapView
            objects={objects}
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
