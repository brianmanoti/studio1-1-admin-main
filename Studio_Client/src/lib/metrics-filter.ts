import type { DashboardMetrics } from "@/hooks/use-dashboard-metrics"

type DocumentType = "wages" | "expenses" | "purchaseorders"

export function filterMetricsByType(metrics: DashboardMetrics, type: DocumentType): DashboardMetrics {
  // Filter pending approvals by type
  const filteredApprovals = metrics.pendingApprovals.filter((approval) => {
    if (type === "wages") return approval.wageNumber !== undefined && approval.wageNumber !== ""
    if (type === "expenses") return !approval.wageNumber && !approval.estimateId
    if (type === "purchaseorders") return approval.estimateId !== undefined && approval.estimateId !== ""
    return true
  })

  // Recalculate metrics based on filtered approvals
  const topVendors = calculateTopVendors(filteredApprovals)
  const mostUsedItems = calculateMostUsedItems(filteredApprovals)
  const averageAmount = calculateAverageAmount(filteredApprovals)
  const statusSummary = calculateStatusSummary(filteredApprovals)

  return {
    ...metrics,
    pendingApprovals: filteredApprovals,
    topVendors,
    mostUsedItems,
    averageAmount,
    statusSummary,
  }
}

function calculateTopVendors(approvals: DashboardMetrics["pendingApprovals"]) {
  const vendorMap = new Map<string, number>()

  approvals.forEach((approval) => {
    const current = vendorMap.get(approval.vendorName) || 0
    vendorMap.set(approval.vendorName, current + approval.amount)
  })

  return Array.from(vendorMap.entries())
    .map(([vendorName, totalAmount]) => ({ vendorName, totalAmount }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

function calculateMostUsedItems(approvals: DashboardMetrics["pendingApprovals"]) {
  const itemMap = new Map<string, number>()

  approvals.forEach((approval) => {
    approval.items.forEach((item) => {
      const current = itemMap.get(item.description) || 0
      itemMap.set(item.description, current + item.quantity)
    })
  })

  return Array.from(itemMap.entries())
    .map(([description, totalQuantity]) => ({ description, totalQuantity }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
}

function calculateAverageAmount(approvals: DashboardMetrics["pendingApprovals"]) {
  if (approvals.length === 0) return [{ avgAmount: 0 }]

  const total = approvals.reduce((sum, approval) => sum + approval.amount, 0)
  const avgAmount = total / approvals.length

  return [{ avgAmount }]
}

function calculateStatusSummary(approvals: DashboardMetrics["pendingApprovals"]) {
  const statusMap = new Map<string, number>()

  approvals.forEach((approval) => {
    const current = statusMap.get(approval.status) || 0
    statusMap.set(approval.status, current + 1)
  })

  return Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))
}
