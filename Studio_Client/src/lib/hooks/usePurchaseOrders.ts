import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPO, fetchPOById, fetchPOs, permanentDeletePO, updatePO } from '../api/purchaseOrders';

// GET all purchases
export const usePos = () =>
  useQuery({ queryKey: ['purchases'], queryFn: fetchPOs });

// GET single purchases
export const usePo = (id) =>
  useQuery({
    queryKey: ['purchases', id],
    queryFn: () => fetchPOById(id),
    enabled: !!id, // Only fetch when id exists
  });

// CREATE purchases
export const useCreatePO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPO,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchases'] }),
  });
};

// UPDATE purchases
export const useUpdatePo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePO,
    onSuccess: (_, { id }) =>
      queryClient.invalidateQueries({ queryKey: ['purchases', id] }),
  });
};

// DELETE purchases
export const useDeletePO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: permanentDeletePO,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchases'] }),
  });
};