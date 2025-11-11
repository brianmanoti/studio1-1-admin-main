
import axiosInstance from "@/lib/axios"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// 🧩 Vendor Type
export interface Vendor {
  _id: string
  vendorId: string
  companyName: string
  category: string
  contactPerson: string
  email: string
  phone: string
  website?: string
  address: string
  city?: string
  state?: string
  zipCode?: string
  taxId?: string
  paymentTerms: string
  notes?: string
  status: "Active" | "Inactive"
  isDeleted: boolean
  history: {
    action: string
    timestamp: string
    details?: string
  }[]
  createdAt: string
  updatedAt: string
  __v?: number
}

// 🧩 Input type (for creating/updating)
export type VendorInput = Omit<
  Vendor,
  "_id" | "vendorId" | "createdAt" | "updatedAt" | "__v" | "isDeleted" | "history"
>

// 🧠 Fetch Vendors
async function fetchVendors(): Promise<Vendor[]> {
  const res = await axiosInstance.get<Vendor[]>("/api/vendors")
  return res.data
}

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}

// 🧱 Create Vendor
export const useCreateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VendorInput) => {
      const res = await axiosInstance.post("/api/vendors", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
    onError: (error: any) => {
      console.error("❌ Error creating vendor:", error)
      throw error
    },
  })
}

// ✏️ Update Vendor
export const useUpdateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VendorInput }) => {
      const res = await axiosInstance.put(`/api/vendors/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
    onError: (error: any) => {
      console.error("❌ Error updating vendor:", error)
      throw error
    },
  })
}

// 🗑️ Delete Vendor
export const useDeleteVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.delete(`/api/vendors/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
    onError: (error: any) => {
      console.error("❌ Error deleting vendor:", error)
      throw error
    },
  })
}
