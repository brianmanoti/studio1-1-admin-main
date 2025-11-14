"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Package, DollarSign, BarChart3, Building2 } from "lucide-react"
import type { ReportsData } from "@/hooks/use-reports"

interface ReportsTabProps {
  data: ReportsData
}

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

const getStatusColor = (status: string) => {
  const colors = {
    completed: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    draft: "bg-gray-100 text-gray-800 border-gray-200"
  }
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
}

export function ReportsTab({ data }: ReportsTabProps) {
  const top = data.topRecords || {}
  const highestWage = top.highestWage || {}
  const highestExpense = top.highestExpense || {}
  const highestPO = top.highestPurchaseOrder || {}

  const kpiCards = [
    {
      title: "Project Value",
      value: formatCurrency(data.project?.value),
      icon: DollarSign,
      description: "Total project budget",
      trend: "on-track",
      color: "bg-blue-500"
    },
    {
      title: "Actual Spent",
      value: formatCurrency(data.project?.actualSpent),
      icon: BarChart3,
      description: "Total expenditure",
      trend: "monitoring",
      color: "bg-blue-600"
    },
    {
      title: "Balance",
      value: formatCurrency(data.project?.balance),
      icon: TrendingUp,
      description: "Remaining budget",
      trend: "positive",
      color: "bg-emerald-500"
    },
    {
      title: "Active Vendors",
      value: data.vendors?.length || 0,
      icon: Users,
      description: "Partner companies",
      trend: "stable",
      color: "bg-blue-700"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Financial Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {data.project.name} • Comprehensive Financial Overview
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
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, index) => (
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
                    {card.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${card.color} bg-opacity-10 text-blue-600 dark:text-blue-400`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-8">
          {/* Project Overview */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Project Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Budget Utilization</p>
                  <div className="w-20 h-20 mx-auto mb-2 relative">
                    <Progress 
                      value={((Number(data.project?.actualSpent) || 0) / (Number(data.project?.value) || 1)) * 100} 
                      className="w-20 h-20 rounded-full [&>div]:bg-blue-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Math.round(((Number(data.project?.actualSpent) || 0) / (Number(data.project?.value) || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Project Value</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(data.project?.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actual Spent</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(data.project?.actualSpent)}</p>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Remaining Balance</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.project?.balance)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available for use</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimates Summary */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Estimates Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.estimates.summary.totalEstimateValue)}
                  </p>
                </div>
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.estimates.summary.totalEstimateSpent)}
                  </p>
                </div>
                <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Balance</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.estimates.summary.totalEstimateBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle>Status Summary by Type</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(data.summaries).map(([type, statuses]) => (
                  <div key={type} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                      {type}
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(statuses).map(([status, info]) => (
                        <div key={status} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
                              {status}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {info.count} items
                            </span>
                          </div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {formatCurrency(info.totalValue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Item Usage */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Item Usage Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!data.itemUsage?.length ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No item usage data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-200 dark:border-blue-800">
                        <TableHead className="font-semibold text-gray-900 dark:text-white">Item</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white text-right">Quantity</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white text-right">Avg Price</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white text-right">Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.itemUsage.map((item) => (
                        <TableRow key={item._id} className="border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {item._id}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                            {item.totalQuantity}
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-gray-300">
                            {formatCurrency(item.avgPrice)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(item.avgPrice * item.totalQuantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <TableCell className="font-bold text-gray-900 dark:text-white">Total</TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-white">
                          {data.itemUsage.reduce((s, i) => s + i.totalQuantity, 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-white">—</TableCell>
                        <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                            data.itemUsage.reduce((s, i) => s + i.avgPrice * i.totalQuantity, 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          {/* Top Records */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle>Top Records</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Highest Wage</p>
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">{highestWage.vendor ?? "—"}</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {highestWage.amount ? formatCurrency(highestWage.amount) : "—"}
                  </p>
                </div>

                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Highest Expense</p>
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">{highestExpense.vendor ?? "—"}</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {highestExpense.amount ? formatCurrency(highestExpense.amount) : "—"}
                  </p>
                </div>

                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Highest Purchase Order</p>
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">{highestPO.vendor ?? "—"}</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {highestPO.amount ? formatCurrency(highestPO.amount) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendors & Subcontractors */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle>Partners</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Active Vendors
                  </h4>
                  <div className="space-y-2">
                    {data.vendors?.length ? (
                      data.vendors.slice(0, 4).map((v) => (
                        <div key={v.companyName} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{v.companyName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{v.category}</p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                            Active
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No active vendors</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    Subcontractors
                  </h4>
                  <div className="space-y-2">
                    {data.subcontractors?.length ? (
                      data.subcontractors.slice(0, 4).map((s) => (
                        <div key={s.code} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{s.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.code}</p>
                          </div>
                          <p className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                            {formatCurrency(s.rate)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No subcontractors</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Ratios */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Cost Efficiency</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {data.ratios.costEfficiency}
                  </p>
                  <Progress
                    value={parseFloat(data.ratios.costEfficiency.replace("%", "")) || 0}
                    className="h-2 [&>div]:bg-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Commitments</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(data.ratios.totalCommitments)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Subcontractor Spend</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(data.ratios.totalSubcontractorSpend)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}