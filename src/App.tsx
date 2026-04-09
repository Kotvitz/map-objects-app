import { useCallback, useState } from "react";
import { ActionIcon, Group, Stack, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { Layout } from "./components/layout/Layout";
import { MapView } from "./features/map/MapView";
import { ObjectFormModal } from "./features/objects/ObjectFormModal";
import type { MapObject, SupportedGeometry } from "./types/MapObject";

type ObjectFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  color: string;
};

function App() {
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [pendingGeometry, setPendingGeometry] = useState<SupportedGeometry | null>(null);
  const [formOpened, setFormOpened] = useState(false);

  const handleGeometryCreated = useCallback((geometry: SupportedGeometry) => {
    setPendingGeometry(geometry);
    setFormOpened(true);
  }, []);

  const handleCloseForm = () => {
    setFormOpened(false);
    setPendingGeometry(null);
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

  const handleDeleteObject = (objectId: string) => {
    setObjects((current) =>
      current
        .filter((object) => object.id !== objectId)
        .map((object, index) => ({
          ...object,
          order: index,
        }))
    );
  };

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
                  <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                    <Text fw={500} truncate>
                      {object.name}
                    </Text>
                  </Stack>

                  <ActionIcon
                    color="red"
                    variant="light"
                    aria-label={`Delete ${object.name}`}
                    onClick={() => handleDeleteObject(object.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))
            )}
          </Stack>
        }
        map={
          <MapView
            objects={objects}
            onGeometryCreated={handleGeometryCreated}
          />
        }
      />

      <ObjectFormModal
        opened={formOpened}
        onClose={handleCloseForm}
        onSubmit={handleCreateObject}
      />
    </>
  );
}

export default App;