import axiosInstance from "@/lib/axios"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface Vendor {
  _id: string
  companyName: string
  category: string
  contactPerson: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  zipCode: string
  taxId: string
  paymentTerms: string
  notes: string
  status: string
  isDeleted: boolean
  history: any[]
  createdAt: string
  updatedAt: string
  vendorId: string
  __v: number
}

async function fetchVendors(): Promise<Vendor[]> {
  const response = await axiosInstance.get<Vendor[]>("/api/vendors")
  return response.data // return the array directly
}

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    staleTime: 1000 * 60 * 5,
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/vendors/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      await axiosInstance.put(`/api/vendors/${id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
  })
}
