import axiosInstance from "@/lib/axios"
import { useQuery, useMutation, useQueryClient  } from "@tanstack/react-query"

export interface Item {
  _id: string
  name: string
  description: string
  unit: string
  unitPrice: number
  __v: number
  createdAt: string
  updatedAt: string
}

interface ItemsResponse {
  success: boolean
  data: Item[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

async function fetchItems(): Promise<Item[]> {
  const response = await axiosInstance.get<ItemsResponse>("/api/items")
  return response.data.data
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}


export const useDeleteItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/items/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export const useUpdateItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      await axiosInstance.put(`/api/items/${id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}