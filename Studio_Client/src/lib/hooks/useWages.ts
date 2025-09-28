import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createWage, deleteWage, fetchWageById, fetchWages, updateWage } from '../api/wages';

// GET all purchases
export const useWages = () =>
  useQuery({ queryKey: ['wages'], queryFn: fetchWages });

// GET single purchases
export const usePurchase = (id) =>
  useQuery({
    queryKey: ['wages', id],
    queryFn: () => fetchWageById(id),
    enabled: !!id, // Only fetch when id exists
  });

// CREATE purchases
export const useCreateWage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wages'] }),
  });
};

// UPDATE purchases
export const useUpdateWage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWage,
    onSuccess: (_, { id }) =>
      queryClient.invalidateQueries({ queryKey: ['wages', id] }),
  });
};

// DELETE purchases
export const useDeleteWage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wages'] }),
  });
};