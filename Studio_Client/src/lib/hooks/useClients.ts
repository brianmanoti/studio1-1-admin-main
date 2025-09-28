import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { createClient, deleteClient, getClientById, getClients, updateClient } from "../api/clients"

//  Get all
export const useClients = () => {
  return useQuery({ queryKey: ["clients"], queryFn: getClients })
}

// Get single
export const useClient = (id: string) => {
  return useQuery({ queryKey: ["clients", id], queryFn: () => getClientById(id) })
}

//  Create
export const useCreateClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}

// Update
export const useUpdateClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateClient(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["clients", id] })
    },
  })
}

//  Delete
export const useDeleteClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}
