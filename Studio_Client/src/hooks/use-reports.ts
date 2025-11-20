import axiosInstance from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"


export interface ReportsData {
  project: {
    id: string
    name: string
    client: string
    value: string
    actualSpent: string
    balance: string
  }
  estimates: {
    summary: {
      totalEstimateValue: string
      totalEstimateSpent: string
      totalEstimateBalance: string
    }
    list: Array<{
      _id: string
      name: string
      total: number
      spent: number
      balance: number
      estimateId: string
      createdAt: string
      updatedAt: string
    }>
  }
  summaries: {
    [key: string]: {
      pending: { _id: string; totalValue: number; count: number }
      approved: { totalValue: number; count: number }
      declined: { totalValue: number; count: number }
    }
  }
  topRecords: {
    highestWage: { vendor: string; amount: string; date: string }
    highestExpense: { vendor: string; amount: string; date: string }
    highestPurchaseOrder: { vendor: string; amount: string; date: string }
  }
  subcontractors: Array<any>
  vendors: Array<any>
  itemUsage: Array<{
    _id: string
    totalQuantity: number
    avgPrice: number
  }>
  ratios: {
    costEfficiency: string
    totalCommitments: string
    totalSubcontractorSpend: string
  }
  generatedAt: string
}

export function useReports(projectId: string) {
  return useQuery({
    queryKey: ["reports", projectId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ReportsData>(`/api/estimates/reports/${projectId}`)
      return data
    },
    enabled: !!projectId,
  })
}
