"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Package, DollarSign, BarChart3, Building2 } from 'lucide-react'
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

const formatCurrencyCompact = (num: number | string) => {
  if (num === null || num === undefined) return "KSh 0.00"
  const clean = String(num).replace(/,/g, "").trim()
  const parsed = parseFloat(clean)
  
  if (parsed >= 1_000_000) {
    return (parsed / 1_000_000).toFixed(1) + "M"
  } else if (parsed >= 1_000) {
    return (parsed / 1_000).toFixed(1) + "K"
  }
  return formatCurrency(parsed)
}

const getStatusColor = (status: string) => {
  const colors = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    draft: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800"
  }
  return colors[status as keyof typeof colors] || "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800"
}

const KPICard = ({ title, value, icon: Icon, description, color }: any) => (
  <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-800">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1 text-pretty truncate">
            {value}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100 flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export function ReportsTab({ data }: ReportsTabProps) {
  const top = data.topRecords || {}
  const highestWage = top.highestWage || {}
  const highestExpense = top.highestExpense || {}
  const highestPO = top.highestPurchaseOrder || {}

  const kpiCards = [
    {
      title: "Project Value",
      value: formatCurrencyCompact(data.project?.value),
      icon: DollarSign,
      description: "Total project budget",
      color: "bg-blue-500"
    },
    {
      title: "Total Spent",
      value: formatCurrencyCompact(data.project?.actualSpent),
      icon: BarChart3,
      description: "Cumulative expenditure",
      color: "bg-blue-600"
    },
    {
      title: "Remaining Balance",
      value: formatCurrencyCompact(data.project?.balance),
      icon: TrendingUp,
      description: "Available budget",
      color: "bg-emerald-500"
    },
    {
      title: "Active Partners",
      value: `${data.vendors?.length || 0}`,
      icon: Users,
      description: "Vendor collaborators",
      color: "bg-indigo-500"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-pretty mb-2">
              Financial Overview
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 text-pretty">
              {data.project.name} • Real-time project financial insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs sm:text-sm">
              ● Live Data
            </Badge>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Just now
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {kpiCards.map((card, index) => (
          <KPICard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6 lg:space-y-8">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-lg">
                <Building2 className="w-5 h-5" />
                <span>Project Budget Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Budget Utilization</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {Math.round(((Number(data.project?.actualSpent) || 0) / (Number(data.project?.value) || 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((Number(data.project?.actualSpent) || 0) / (Number(data.project?.value) || 1)) * 100} 
                    className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Budget</p>
                    <p className="text-sm lg:text-lg font-bold text-blue-700 dark:text-blue-300 truncate">
                      {formatCurrencyCompact(data.project?.value)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Spent</p>
                    <p className="text-sm lg:text-lg font-bold text-blue-700 dark:text-blue-300 truncate">
                      {formatCurrencyCompact(data.project?.actualSpent)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Balance</p>
                    <p className="text-sm lg:text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      {formatCurrencyCompact(data.project?.balance)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-lg">
                <BarChart3 className="w-5 h-5" />
                <span>Estimates Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Total Value</p>
                  <p className="text-lg lg:text-2xl font-bold text-blue-700 dark:text-blue-300 truncate">
                    {formatCurrencyCompact(data.estimates.summary.totalEstimateValue)}
                  </p>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Total Spent</p>
                  <p className="text-lg lg:text-2xl font-bold text-blue-700 dark:text-blue-300 truncate">
                    {formatCurrencyCompact(data.estimates.summary.totalEstimateSpent)}
                  </p>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Balance</p>
                  <p className="text-lg lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {formatCurrencyCompact(data.estimates.summary.totalEstimateBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="text-lg">Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(data.summaries).map(([type, statuses]) => (
                  <div key={type} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-5 border border-slate-200 dark:border-slate-600">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
                      {type}
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(statuses).map(([status, info]) => (
                        <div key={status} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Badge variant="outline" className={`text-xs whitespace-nowrap flex-shrink-0 ${getStatusColor(status)}`}>
                              {status.replace('_', ' ')}
                            </Badge>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                              {info.count}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-white whitespace-nowrap text-xs flex-shrink-0">
                            {formatCurrencyCompact(info.totalValue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-lg">
                <Package className="w-5 h-5" />
                <span>Item Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!data.itemUsage?.length ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No item usage data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                      <TableHead className="font-semibold text-slate-900 dark:text-white text-xs">Item</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white text-right text-xs">Qty</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white text-right text-xs">Avg Price</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-white text-right text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.itemUsage.map((item) => (
                      <TableRow key={item._id} className="border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                        <TableCell className="font-medium text-slate-900 dark:text-white text-xs max-w-[100px] sm:max-w-none">
                          {item._id}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 dark:text-white text-xs">
                          {item.totalQuantity}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-300 text-xs">
                          {formatCurrencyCompact(item.avgPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400 text-xs">
                          {formatCurrencyCompact(item.avgPrice * item.totalQuantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-blue-50 dark:bg-blue-900/20 border-slate-200 dark:border-slate-600">
                      <TableCell className="font-bold text-slate-900 dark:text-white text-xs">Total</TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-white text-xs">
                        {data.itemUsage.reduce((s, i) => s + i.totalQuantity, 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-white text-xs">—</TableCell>
                      <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {formatCurrencyCompact(
                          data.itemUsage.reduce((s, i) => s + i.avgPrice * i.totalQuantity, 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="text-lg">Status Summary by Type</CardTitle>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:space-y-8">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="w-10 h-10 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Highest Wage</p>
                  <p className="font-semibold text-slate-900 dark:text-white mb-2 text-sm truncate min-h-[20px]">
                    {highestWage.vendor ?? "—"}
                  </p>
                  <p className="text-base lg:text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
                    {highestWage.amount ? formatCurrencyCompact(highestWage.amount) : "—"}
                  </p>
                </div>

                <div className="text-center p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <div className="w-10 h-10 bg-indigo-200 dark:bg-indigo-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Highest Expense</p>
                  <p className="font-semibold text-slate-900 dark:text-white mb-2 text-sm truncate min-h-[20px]">
                    {highestExpense.vendor ?? "—"}
                  </p>
                  <p className="text-base lg:text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate">
                    {highestExpense.amount ? formatCurrencyCompact(highestExpense.amount) : "—"}
                  </p>
                </div>

                <div className="text-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <div className="w-10 h-10 bg-emerald-200 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Top Purchase Order</p>
                  <p className="font-semibold text-slate-900 dark:text-white mb-2 text-sm truncate min-h-[20px]">
                    {highestPO.vendor ?? "—"}
                  </p>
                  <p className="text-base lg:text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {highestPO.amount ? formatCurrencyCompact(highestPO.amount) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="text-lg">Partners</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    Vendors
                  </h4>
                  <div className="space-y-2">
                    {data.vendors?.length ? (
                      data.vendors.slice(0, 4).map((v) => (
                        <div key={v.companyName} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600 text-xs gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 dark:text-white truncate text-sm">{v.companyName}</p>
                            <p className="text-slate-500 dark:text-slate-400 truncate text-xs">{v.category}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs whitespace-nowrap flex-shrink-0">
                            Active
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">No active vendors</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4" />
                    Subcontractors
                  </h4>
                  <div className="space-y-2">
                    {data.subcontractors?.length ? (
                      data.subcontractors.slice(0, 4).map((s) => (
                        <div key={s.code} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600 text-xs gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 dark:text-white truncate text-sm">{s.name}</p>
                            <p className="text-slate-500 dark:text-slate-400 truncate text-xs">{s.code}</p>
                          </div>
                          <p className="font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap text-xs flex-shrink-0">
                            {formatCurrencyCompact(s.rate)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">No subcontractors</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-t-lg">
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Cost Efficiency</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {data.ratios.costEfficiency}
                    </p>
                  </div>
                  <Progress
                    value={parseFloat(data.ratios.costEfficiency.replace("%", "")) || 0}
                    className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Commitments</p>
                    <p className="text-xs lg:text-sm font-bold text-blue-600 dark:text-blue-400 truncate">
                      {formatCurrencyCompact(data.ratios.totalCommitments)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">SC Spend</p>
                    <p className="text-xs lg:text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">
                      {formatCurrencyCompact(data.ratios.totalSubcontractorSpend)}
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
