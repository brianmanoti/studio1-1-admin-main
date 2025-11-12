"use client"

import { useParams, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Download, Edit, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"
import * as React from "react"

// 🧮 Utility: Currency formatter (KES)
const formatKES = (value?: number) =>
  value && !isNaN(value)
    ? new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2,
      }).format(value)
    : "KSh 0.00"

// 💾 API Query
async function fetchPayslip(id: string) {
  const { data } = await axiosInstance.get(`/api/pay-slip/${id}`)
  return data
}

const PayslipDetailsPage = React.memo(() => {
  const { PayslipId: id } = useParams({ strict: false }) as { PayslipId: string }
  const navigate = useNavigate()
  const [downloading, setDownloading] = React.useState(false)

  const { data: payslip, isLoading, error } = useQuery({
    queryKey: ["payslip", id],
    queryFn: () => fetchPayslip(id),
    enabled: !!id,
    staleTime: 300_000,
  })

  const handleDownloadPDF = async () => {
    if (!id) return
    setDownloading(true)
    try {
      const res = await axiosInstance.get(`/api/pay-slip/${id}/pdf`, {
        responseType: "blob",
      })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${payslip?.employeeName || "payslip"}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Payslip PDF downloaded successfully")
    } catch (e) {
      toast.error("Failed to download payslip PDF")
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p>Loading payslip details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load payslip details. Please try again later.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate({ to: "/projects/$projectId/payslip/" })}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    )
  }

  if (!payslip) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Payslip not found.</p>
        <Button
          onClick={() => navigate({ to: "/projects/$projectId/payslip/" })}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-muted/30 to-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/projects/$projectId/payslip/" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Payslip Details</h1>
        </div>

        {/* Payslip Card */}
        <Card className="border border-border/50 shadow-sm bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-medium">
                  {payslip.employeeName}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(payslip.date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  payslip.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : payslip.status === "declined"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-lg border shadow-xs">
                <p className="text-sm text-muted-foreground">Gross Pay</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatKES(payslip.grossPay)}
                </p>
              </div>
              <div className="bg-card p-4 rounded-lg border shadow-xs">
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatKES(payslip.calculations?.totalDeductions)}
                </p>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow-xs">
                <p className="text-sm text-primary-foreground">Net Pay</p>
                <p className="text-2xl font-semibold mt-1 text-primary-foreground">
                  {formatKES(payslip.calculations?.netPay)}
                </p>
              </div>
            </div>

            {/* Calculation Details */}
            {payslip.calculations && Object.keys(payslip.calculations).length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Calculation Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {Object.entries(payslip.calculations).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <span className="font-medium">
                        {typeof val === "number" ? formatKES(val) : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prepared By:</span>
                <span className="font-medium">{payslip.preparedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {new Date(payslip.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t pt-4">
              <Button
                variant="outline"
                className="flex-1"
                disabled={downloading}
                onClick={handleDownloadPDF}
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => navigate({ to: `/projects/$projectId/payslip/${id}/edit` })}
              >
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Footer */}
      <footer className="mt-12 border-t border-border/40 pt-6 pb-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} <span className="font-medium">Studio 1-1</span>{" "}
          · Digital Payroll Interface
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Crafted with precision & simplicity · v2.5
        </p>
      </footer>
    </div>
  )
})

export default PayslipDetailsPage
