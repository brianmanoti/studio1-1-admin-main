"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "./metric-card"
import { SpendTrendChart } from "./spend-trend-chart"
import { TopVendors } from "./top-vendors"
import { PendingApprovals } from "./pending-approvals"
import { ReportsTab } from "./reports-tab"
import { TypeSwitcher } from "./type-switcher"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import type { ReportsData } from "@/hooks/use-reports"
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Package, 
  DollarSign,
  BarChart3,
  AlertCircle
} from "lucide-react"

// ✅ Helper to format numbers to Kenyan currency
const formatCurrency = (num: number | string) => {
  if (num === null || num === undefined) return "KSh 0.00"
  const clean = String(num).replace(/,/g, "").trim()
  const parsed = parseFloat(clean)
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(isNaN(parsed) ? 0 : parsed)
}

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  // ✅ Derived values with safety
  const totalPending =
    metrics.statusSummary?.reduce((sum, item) => sum + (item.count || 0), 0) || 0

  const avgAmount = Number(metrics.averageAmount?.[0]?.avgAmount || 0)

  const topVendor = metrics.topVendors?.[0] || {}
  const mostUsedItem = metrics.mostUsedItems?.[0] || {}

  const metricCards = [
    {
      title: "Pending Approvals",
      value: totalPending.toString(),
      subtitle: "Items awaiting approval",
      icon: Clock,
      color: "bg-orange-500",
      trend: "attention"
    },
    {
      title: "Average Amount",
      value: formatCurrency(avgAmount),
      subtitle: "Per transaction",
      icon: DollarSign,
      color: "bg-blue-500",
      trend: "neutral"
    },
    {
      title: "Top Vendor",
      value: topVendor.vendorName || "N/A",
      subtitle: formatCurrency(topVendor.totalAmount || 0),
      icon: Users,
      color: "bg-emerald-500",
      trend: "positive"
    },
    {
      title: "Most Used Item",
      value: mostUsedItem.description || "N/A",
      subtitle: `${mostUsedItem.totalQuantity || 0} units`,
      icon: Package,
      color: "bg-purple-500",
      trend: "info"
    }
  ]

  return (
    <div className="min-h-screen  rounded-md">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-2 lg:p-1.5 ">
        {/* Enhanced Tabs Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Project Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Real-time insights and analytics
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                Live Data
              </Badge>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Updated just now
              </div>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-lg border border-blue-200 dark:border-blue-800">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 data-[state=active]:border data-[state=active]:border-blue-200 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-800 transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 data-[state=active]:border data-[state=active]:border-blue-200 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-800 transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-5">
          {/* Document Type Switcher */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg pb-4">
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Document Type</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <TypeSwitcher activeType={documentType} onTypeChange={setDocumentType} />
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Key Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricCards.map((card, index) => (
                <Card key={index} className="relative overflow-hidden border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${card.color} opacity-10`} />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                          {card.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {card.value}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {card.subtitle}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${card.color} bg-opacity-10 text-${card.color.replace('bg-', '')}`}>
                        <card.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Analytics Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Spend Trend</h3>
                    <SpendTrendChart data={metrics.monthlySpendTrend} />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Vendors</h3>
                  <TopVendors vendors={metrics.topVendors} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Pending Approvals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports">
          <ReportsTab data={reports} />
        </TabsContent>
      </Tabs>
    </div>
  )
}