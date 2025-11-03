import { useQuery } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"

interface POItem {
  name: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

interface PurchaseOrder {
  _id: string
  poNumber: string
  projectId: string
  company: string
  status: "pending" | "approved" | "rejected" | "completed"
  date: string
  deliveryDate: string
  deliveryAddress: string
  notes: string
  vendorName: string
  vendorContact: string
  vendorEmail: string
  vendorPhone: string
  vendorAddress: string
  items: POItem[]
  amount: number
  estimateId: string
  reference: string
}

export function usePurchaseOrder(purchaseId: string) {
  return useQuery<PurchaseOrder>({
    queryKey: ["purchase-order", purchaseId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/purchase-orders/${purchaseId}`)
      return data
    },
    enabled: !!purchaseId,
  })
}
