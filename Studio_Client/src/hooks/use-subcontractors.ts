import axiosInstance from "@/lib/axios"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"


export interface Project {
  projectId: string
  estimateId: string
  allocationLevel: string
  allocationRef: string
  allocationModel: string
  allocatedBudget: number
  totalWages: number
  totalExpenses: number
  totalPOS: number
  balance: number
  progress: number
  lastUpdated: string
}

export interface Payment {
  amount: number
  date: string
  description: string
  reference: string
}

export interface Subcontractor {
  _id: string
  companyName: string
  contactPerson: string
  phoneNumber: string
  email: string
  typeOfWork: string
  status: "approved" | "pending" | "rejected"
  projects: Project[]
  payments: Payment[]
  totalAllocatedBudget: number
  totalSpent: number
  totalBalance: number
  totalPayments: number
  netBalance: number
  createdAt: string
  updatedAt: string
}

async function fetchSubcontractors(): Promise<Subcontractor[]> {
  const response = await axiosInstance.get("/api/subcontractors")
  return response.data
}

async function fetchSubcontractorById(id: string): Promise<Subcontractor> {
  const response = await axiosInstance.get(`/api/subcontractors/${id}`)
  return response.data
}

async function createSubcontractor(data: Partial<Subcontractor>): Promise<Subcontractor> {
  const response = await axiosInstance.post("/api/subcontractors", data)
  return response.data
}

async function updateSubcontractor(id: string, data: Partial<Subcontractor>): Promise<Subcontractor> {
  const response = await axiosInstance.put(`/api/subcontractors/${id}`, data)
  return response.data
}

async function deleteSubcontractor(id: string): Promise<void> {
  await axiosInstance.delete(`/api/subcontractors/${id}`)
}

export function useSubcontractors() {
  return useQuery({
    queryKey: ["subcontractors"],
    queryFn: fetchSubcontractors,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSubcontractor(id: string) {
  return useQuery({
    queryKey: ["subcontractors", id],
    queryFn: () => fetchSubcontractorById(id),
    enabled: !!id,
  })
}

export function useCreateSubcontractor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSubcontractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] })
    },
  })
}

export function useUpdateSubcontractor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subcontractor> }) => updateSubcontractor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] })
    },
  })
}

export function useDeleteSubcontractor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSubcontractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] })
    },
  })
}



export function useUpdateSubcontractorStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const response = await axiosInstance.patch(`/api/subcontractors/${id}/${action}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] })
    },
  })
}