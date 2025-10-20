"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download } from "lucide-react"
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


export function ReportsTab({ data }: ReportsTabProps) {
  const handleDownload = (format: "pdf" | "csv") => {
    window.open(`/api/reports/${data.project.id}/export/${format}`, "_blank")
  }

  const top = data.topRecords || {}
  const highestWage = top.highestWage || {}
  const highestExpense = top.highestExpense || {}
  const highestPO = top.highestPurchaseOrder || {}

  return (
    <div className="space-y-8">
      {/* Header with Export Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Project Financial Report</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => handleDownload("pdf")}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={() => handleDownload("csv")}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project Name</p>
              <p className="text-lg font-semibold text-foreground">{data.project.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project Value</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(data.project?.value)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actual Spent</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(data.project?.actualSpent)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(data.project?.balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimates Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estimates Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Value</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(data.estimates.summary.totalEstimateValue)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(data.estimates.summary.totalEstimateSpent)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.estimates.summary.totalEstimateBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Status Summary by Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(data.summaries).map(([type, statuses]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-base font-semibold">{type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statuses).map(([status, info]) => (
                    <div key={status} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium capitalize">{status}</p>
                        <p className="text-xs text-muted-foreground mt-1">{info.count} items</p>
                      </div>
                      <p className="font-semibold text-sm text-right">{formatCurrency(info.totalValue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Highest Wage</p>
              <p className="font-semibold mb-1">{highestWage.vendor ?? "—"}</p>
              <p className="text-2xl font-bold text-primary">
                {highestWage.amount ? formatCurrency(highestWage.amount) : "—"}
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Highest Expense</p>
              <p className="font-semibold mb-1">{highestExpense.vendor ?? "—"}</p>
              <p className="text-2xl font-bold text-primary">
                {highestExpense.amount ? formatCurrency(highestExpense.amount) : "—"}
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Highest PO</p>
              <p className="font-semibold mb-1">{highestPO.vendor ?? "—"}</p>
              <p className="text-2xl font-bold text-primary">
                {highestPO.amount ? formatCurrency(highestPO.amount) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors & Subcontractors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vendors & Subcontractors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2">Active Vendors</p>
              <ul className="space-y-1">
                {data.vendors?.length ? (
                  data.vendors.slice(0, 5).map((v) => (
                    <li key={v.companyName} className="text-sm">
                      {v.companyName} — <span className="text-muted-foreground">{v.category}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No active vendors found.</p>
                )}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Subcontractors</p>
              <ul className="space-y-1">
                {data.subcontractors?.length ? (
                  data.subcontractors.slice(0, 5).map((s) => (
                    <li key={s.code} className="text-sm">
                      {s.name} — {formatCurrency(s.rate)}
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No subcontractors found.</p>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Item Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.itemUsage?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No item usage data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.itemUsage.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item._id}</TableCell>
                      <TableCell className="text-right font-semibold">{item.totalQuantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.avgPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      {data.itemUsage.reduce((s, i) => s + i.totalQuantity, 0)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
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

      {/* Cost Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Ratios & Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Cost Efficiency</p>
              <p className="text-3xl font-bold">{data.ratios.costEfficiency}</p>
              <Progress
                value={parseFloat(data.ratios.costEfficiency.replace("%", "")) || 0}
                className="h-2 mt-2"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Commitments</p>
              <p className="text-3xl font-bold">{formatCurrency(data.ratios.totalCommitments)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Subcontractor Spend</p>
              <p className="text-3xl font-bold">
                {formatCurrency(data.ratios.totalSubcontractorSpend)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
