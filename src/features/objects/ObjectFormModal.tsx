import { Button, ColorInput, Group, Modal, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

type ObjectFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  color: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: ObjectFormValues) => void;
};

export function ObjectFormModal({ opened, onClose, onSubmit }: Props) {
  const form = useForm<ObjectFormValues>({
    initialValues: {
      name: "",
      description: "",
      imageUrl: "",
      color: "#3388ff",
    },
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

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = (values: ObjectFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Add object" centered>
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
            <Button type="submit">Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}