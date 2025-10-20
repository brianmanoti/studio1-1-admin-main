import axiosInstance from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"


export interface DashboardMetrics {
  scope: string
  projectId: string
  company: null | string
  dateRange: {
    startDate: null | string
    endDate: null | string
  }
  metrics: string[]
  statusSummary: Array<{ count: number; status: string }>
  monthlySpendTrend: Array<{ totalAmount: number; month: string }>
  approvalTrend: Array<{
    statuses: Array<{ status: string; count: number }>
    month: string
  }>
  topVendors: Array<{ totalAmount: number; vendorName: string }>
  averageAmount: Array<{ avgAmount: number }>
  pendingApprovals: Array<{
    _id: string
    projectId: string
    reference: string
    company: string
    status: string
    date: string
    deliveryDate: string
    deliveryAddress: string
    vendorName: string
    vendorContact: string
    vendorEmail: string
    vendorAddress: string
    items: Array<{
      description: string
      quantity: number
      unit: string
      unitPrice: number
    }>
    amount: number
    estimateId: string
    estimateLevel: string
    estimateTargetId: string
  }>
  recentApproved: Array<any>
  mostUsedItems: Array<{ totalQuantity: number; description: string }>
}

type DocumentType = "wages" | "expenses" | "purchaseorders"

export function useDashboardMetrics(projectId: string, type: DocumentType = "wages") {
  return useQuery({
    queryKey: ["dashboard-metrics", projectId, type],
    queryFn: async () => {
      const { data } = await axiosInstance.get<DashboardMetrics>(`/api/${type}/${projectId}/insights`)
      return data
    },
    enabled: !!projectId,
  })
}
