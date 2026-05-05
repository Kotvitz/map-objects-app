import { Button, Group, Modal, Text } from "@mantine/core";

type DeleteObjectModalProps = {
  opened: boolean;
  objectName?: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteObjectModal({
  opened,
  objectName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteObjectModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete object" centered>
      <Text>
        Are you sure you want to delete{" "}
        <strong>{objectName ?? "this object"}</strong>? This action cannot be
        undone.
      </Text>

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>

        <Button color="red" onClick={onConfirm} loading={isDeleting}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}