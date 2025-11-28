// hooks/usePermissions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionService } from '../api/permissionService';
import { toast } from 'sonner';

export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => permissionService.getUserPermissions(userId),
    enabled: !!userId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAvailablePermissions = () => {
  return useQuery({
    queryKey: ['available-permissions'],
    queryFn: () => permissionService.getAvailablePermissions(),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useUpdatePermissions = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissions: string[]) => 
      permissionService.updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
      toast.success('Permissions updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update permissions');
      console.error('Update permissions error:', error);
    },
  });
};

export const useResetPermissions = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => permissionService.resetPermissions(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
      toast.success('Permissions reset to defaults');
    },
    onError: (error: Error) => {
      toast.error('Failed to reset permissions');
      console.error('Reset permissions error:', error);
    },
  });
};