import { useCallback, useMemo, useState } from "react";
import { ActionIcon, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { Layout } from "./components/layout/Layout";
import { MapView } from "./features/map/MapView";
import {
  ObjectFormModal,
  type ObjectFormValues,
} from "./features/objects/ObjectFormModal";
import type { MapObject, SupportedGeometry } from "./types/MapObject";

function App() {
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [pendingGeometry, setPendingGeometry] = useState<SupportedGeometry | null>(null);
  const [formOpened, setFormOpened] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    objectId: string;
    requestId: number;
  } | null>(null);

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

    const newObject: MapObject = {
      id: crypto.randomUUID(),
      name: values.name,
      description: values.description,
      imageUrl: values.imageUrl,
      color: values.color,
      geometry: pendingGeometry,
      order: objects.length,
    };

    setObjects((current) => [...current, newObject]);
    setFormOpened(false);
    setPendingGeometry(null);
  };

  const handleEditObject = (values: ObjectFormValues) => {
    if (!editingObjectId) return;

    setObjects((current) =>
      current.map((object) =>
        object.id === editingObjectId
          ? {
              ...object,
              name: values.name,
              description: values.description,
              imageUrl: values.imageUrl,
              color: values.color,
            }
          : object
      )
    );

    setFormOpened(false);
    setEditingObjectId(null);
    setFormMode("create");
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
    setObjects((current) =>
      current
        .filter((object) => object.id !== objectId)
        .map((object, index) => ({
          ...object,
          order: index,
        }))
    );

    setFocusRequest((currentFocusRequest) =>
      currentFocusRequest?.objectId === objectId ? null : currentFocusRequest
    );

    setEditingObjectId((currentEditingId) =>
      currentEditingId === objectId ? null : currentEditingId
    );
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

  return (
    <>
      <Layout
        sidebar={
          <Stack>
            <Text fw={700}>Objects</Text>

            {objects.length === 0 ? (
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
      />
    </>
  );
}

export default App;