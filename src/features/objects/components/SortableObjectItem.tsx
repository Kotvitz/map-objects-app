import {
  ActionIcon,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconGripVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MapObject } from "../../../shared/types/MapObject";

type SortableObjectItemProps = {
  object: MapObject;
  onFocus: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function SortableObjectItem({
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
    <Paper
      ref={setNodeRef}
      withBorder
      radius="md"
      p="xs"
      opacity={isDragging ? 0.6 : 1}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            {...attributes}
            {...listeners}
          >
            <IconGripVertical size={16} />
          </ActionIcon>

          <UnstyledButton onClick={() => onFocus(object.id)} style={{ flex: 1 }}>
            <Stack gap={2}>
              <Text fw={500}>{object.name}</Text>
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
    </Paper>
  );
}