"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "./metric-card"
import { SpendTrendChart } from "./spend-trend-chart"
import { TopVendors } from "./top-vendors"
import { PendingApprovals } from "./pending-approvals"
import { ReportsTab } from "./reports-tab"
import { TypeSwitcher } from "./type-switcher"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import type { ReportsData } from "@/hooks/use-reports"

type DocumentType = "wages" | "expenses" | "purchase-orders"

interface DashboardTabsProps {
  projectId: string
  reports: ReportsData
}

export function DashboardTabs({ projectId, reports }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [documentType, setDocumentType] = useState<DocumentType>("wages")

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(projectId, documentType)

  if (metricsLoading || !metrics) {
    return <div className="text-center py-8 text-muted-foreground">Loading metrics...</div>
  }

  const totalPending = metrics.statusSummary.reduce((sum, item) => sum + item.count, 0)
  const avgAmount = metrics.averageAmount[0]?.avgAmount || 0

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 p-1 rounded-lg">
        <TabsTrigger value="dashboard" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="reports" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
          Reports
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-8">
        <TypeSwitcher activeType={documentType} onTypeChange={setDocumentType} />

        {/* Metrics Grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Pending Approvals" value={totalPending} subtitle="Items awaiting approval" />
            <MetricCard title="Average Amount" value={`$${avgAmount.toLocaleString()}`} subtitle="Per transaction" />
            <MetricCard
              title="Top Vendor"
              value={metrics.topVendors[0]?.vendorName || "N/A"}
              subtitle={`$${metrics.topVendors[0]?.totalAmount.toLocaleString() || 0}`}
            />
            <MetricCard
              title="Most Used Item"
              value={metrics.mostUsedItems[0]?.description || "N/A"}
              subtitle={`${metrics.mostUsedItems[0]?.totalQuantity || 0} units`}
            />
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpendTrendChart data={metrics.monthlySpendTrend} />
          </div>
          <TopVendors vendors={metrics.topVendors} />
        </div>

        {/* Pending Approvals */}
        <PendingApprovals
          approvals={metrics.pendingApprovals.map((approval) => ({
            _id: approval._id,
            reference: approval.reference,
            company: approval.company,
            vendorName: approval.vendorName,
            amount: approval.amount,
            date: approval.date,
            status: approval.status,
          }))}
        />
      </TabsContent>

      <TabsContent value="reports">
        <ReportsTab data={reports} />
      </TabsContent>
    </Tabs>
  )
}
