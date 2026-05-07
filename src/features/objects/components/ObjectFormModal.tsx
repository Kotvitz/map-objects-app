import { useEffect } from "react";
import { Button, ColorInput, Group, Modal, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

export type ObjectFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  color: string;
};

type Props = {
  opened: boolean;
  mode: "create" | "edit";
  initialValues?: ObjectFormValues;
  onClose: () => void;
  onSubmit: (values: ObjectFormValues) => void;
  submitting?: boolean;
};

const defaultValues: ObjectFormValues = {
  name: "",
  description: "",
  imageUrl: "",
  color: "#3388ff",
};

export function ObjectFormModal({
  opened,
  mode,
  initialValues,
  onClose,
  onSubmit,
  submitting = false,
}: Props) {
  const form = useForm<ObjectFormValues>({
    initialValues: initialValues ?? defaultValues,
    validate: {
      name: (value) => (value.trim().length === 0 ? "Name is required" : null),
      imageUrl: (value) => {
        if (!value.trim()) return null;

        try {
          new URL(value);
          return null;
        } catch {
          return "Image URL must be a valid URL";
        }
      },
      color: (value) => (value.trim().length === 0 ? "Color is required" : null),
    },
  });

  useEffect(() => {
    form.setValues(initialValues ?? defaultValues);
    form.resetDirty(initialValues ?? defaultValues);
  }, [initialValues, opened]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = (values: ObjectFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={mode === "create" ? "Add object" : "Edit object"}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Name"
            placeholder="Object name"
            withAsterisk
            {...form.getInputProps("name")}
          />

          <Textarea
            label="Description"
            placeholder="Short description"
            minRows={3}
            {...form.getInputProps("description")}
          />

          <TextInput
            label="Image URL"
            placeholder="https://example.com/image.jpg"
            {...form.getInputProps("imageUrl")}
          />

          <ColorInput
            label="Color"
            placeholder="Pick object color"
            withAsterisk
            {...form.getInputProps("color")}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
              <Button type="submit" loading={submitting}>
                {mode === "create" ? "Save" : "Update"}
              </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}