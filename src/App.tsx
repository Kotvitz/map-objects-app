import { useCallback, useState } from "react";
import { Button, Stack, Text } from "@mantine/core";
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
  const [pendingGeometry, setPendingGeometry] =
    useState<SupportedGeometry | null>(null);
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
                <Button key={object.id} variant="light" justify="flex-start">
                  {object.name}
                </Button>
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
