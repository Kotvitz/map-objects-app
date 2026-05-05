// src/features/objects/hooks/useObjectMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createObject,
  deleteObject,
  reorderObjects,
  updateObject,
} from "../../../services/objectApi";
import type { ObjectFormValues } from "../ObjectFormModal";
import { notifications } from "@mantine/notifications";

type UpdateObjectVariables = {
  id: string;
  input: ObjectFormValues;
};

function showMutationError(message: string) {
  notifications.show({
    color: "red",
    title: "Operation failed",
    message,
  });
}

export function useObjectMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["objects"] });

  const createMutation = useMutation({
    mutationFn: createObject,
    onSuccess: invalidate,
    onError: () => {
      showMutationError("Could not create object. Please try again.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: UpdateObjectVariables) =>
      updateObject(id, input),
    onSuccess: invalidate,
    onError: () => {
      showMutationError("Could not update object. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObject,
    onSuccess: invalidate,
    onError: () => {
      showMutationError("Could not delete object. Please try again.");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderObjects,
    onSuccess: invalidate,
    onError: () => {
      showMutationError("Could not reorder objects. Please try again.");
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,
  };
}
