// src/features/objects/hooks/useObjectMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createObject,
  deleteObject,
  reorderObjects,
  updateObject,
} from "../../../services/objectApi";
import type { ObjectFormValues } from "../ObjectFormModal";

type UpdateObjectVariables = {
  id: string;
  input: ObjectFormValues;
};

export function useObjectMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["objects"] });

  const createMutation = useMutation({
    mutationFn: createObject,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: UpdateObjectVariables) =>
      updateObject(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObject,
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: reorderObjects,
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,
  };
}
