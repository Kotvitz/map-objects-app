import { useCallback, useState } from "react";

import { arrayMove } from "@dnd-kit/sortable";
import { type DragEndEvent } from "@dnd-kit/core";

import { Layout } from "./components/layout/Layout";
import { MapView } from "./features/map/MapView";
import { ObjectSidebar } from "./features/objects/components/ObjectSidebar";

import {
  ObjectFormModal,
  type ObjectFormValues,
} from "./features/objects/ObjectFormModal";

import { useObjects } from "./features/objects/hooks/useObjects";
import { useObjectMutations } from "./features/objects/hooks/useObjectMutations";

import type { DrawMode } from "./shared/types/DrawMode";
import type { SupportedGeometry } from "./shared/types/MapObject";


function App() {
  const [pendingGeometry, setPendingGeometry] =
    useState<SupportedGeometry | null>(null);

  const [formOpened, setFormOpened] = useState(false);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);

  const [focusRequest, setFocusRequest] = useState<{
    objectId: string;
    requestId: number;
  } | null>(null);

  const [activeDrawMode, setActiveDrawMode] = useState<DrawMode | null>(null);

  const { data: objects = [], isLoading, isError } = useObjects();

  const { createMutation, updateMutation, deleteMutation, reorderMutation } =
    useObjectMutations();

  const handleStartDraw = (mode: DrawMode) => {
    setPendingGeometry(null);
    setEditingObjectId(null);
    setFormMode("create");
    setFormOpened(false);
    setActiveDrawMode(mode);
  };

  const handleGeometryCreated = useCallback((geometry: SupportedGeometry) => {
    setPendingGeometry(geometry);
    setFormMode("create");
    setFormOpened(true);
    setActiveDrawMode(null);
  }, []);

  const handleSubmitForm = (values: ObjectFormValues) => {
    if (formMode === "create" && pendingGeometry) {
      createMutation.mutate(
        {
          ...values,
          geometry: pendingGeometry,
        },
        {
          onSuccess: () => {
            setFormOpened(false);
            setPendingGeometry(null);
            setEditingObjectId(null);
            setActiveDrawMode(null);
          },
        },
      );

      return;
    }

    if (formMode === "edit" && editingObjectId) {
      updateMutation.mutate(
        {
          id: editingObjectId,
          input: values,
        },
        {
          onSuccess: () => {
            setFormOpened(false);
            setEditingObjectId(null);
            setActiveDrawMode(null);
          },
        },
      );
    }
  };

  const handleDeleteObject = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setEditingObjectId(null);
      },
    });
  };

  const handleEditObject = (id: string) => {
    setEditingObjectId(id);
    setFormMode("edit");
    setFormOpened(true);
  };

  const handleFocusObject = (id: string) => {
    setFocusRequest({
      objectId: id,
      requestId: Date.now(),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = objects.findIndex((o) => o.id === active.id);
    const newIndex = objects.findIndex((o) => o.id === over.id);

    const reordered = arrayMove(objects, oldIndex, newIndex);

    reorderMutation.mutate(reordered.map((o) => o.id));
  };

  const editingObject = objects.find((o) => o.id === editingObjectId) ?? null;

  return (
    <>
      <Layout
        sidebar={
          <ObjectSidebar
            objects={objects}
            isLoading={isLoading}
            isError={isError}
            onStartDraw={handleStartDraw}
            onFocusObject={handleFocusObject}
            onEditObject={handleEditObject}
            onDeleteObject={handleDeleteObject}
            onDragEnd={handleDragEnd}
          />
        }
        map={
          <MapView
            objects={objects}
            focusRequest={focusRequest}
            activeDrawMode={activeDrawMode}
            onGeometryCreated={handleGeometryCreated}
          />
        }
      />

      <ObjectFormModal
        opened={formOpened}
        mode={formMode}
        initialValues={
          editingObject
            ? {
                name: editingObject.name,
                description: editingObject.description ?? "",
                imageUrl: editingObject.imageUrl ?? "",
                color: editingObject.color,
              }
            : undefined
        }
        onClose={() => setFormOpened(false)}
        onSubmit={handleSubmitForm}
        submitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}

export default App;
