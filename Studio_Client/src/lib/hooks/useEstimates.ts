import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createEstimate, deleteEstimate, fetchEstimateById, fetchEstimates, updateEstimate } from '../api/estimates';

// GET all Estimates
export const useEstimates = () =>
  useQuery({ queryKey: ['estimate'], queryFn: fetchEstimates });

// GET single estimate
export const useEstimate = (id) =>
  useQuery({
    queryKey: ['estimate', id],
    queryFn: () => fetchEstimateById(id),
    enabled: !!id, // Only fetch when id exists
  });

// CREATE Estimate
export const useCreateEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEstimate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estimate'] }),
  });
};

// UPDATE Estimate
export const useUpdateEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEstimate,
    onSuccess: (_, { id }) =>
      queryClient.invalidateQueries({ queryKey: ['estimate', id] }),
  });
};

// DELETE estimate
export const useDeleteEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEstimate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estimate'] }),
  });
};