import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/api/projects"

//  Get all
export const useProjects = () => {
  return useQuery({ queryKey: ["projects"], queryFn: getProjects })
}

// Get single
export const useProject = (id: string) => {
  return useQuery({ queryKey: ["projects", id], queryFn: () => getProjectById(id) })
}

//  Create
export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

// Update
export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["projects", id] })
    },
  })
}

//  Delete
export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
