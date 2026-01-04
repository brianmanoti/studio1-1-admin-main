"use client"
import { useState } from "react"
import { useParams, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, ArrowLeft, Loader2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { useWageOrder } from "@/hooks/use-wage-order"
import { useDownloadWagePDF } from "@/hooks/PDFs/Wages-PDF"

export default function WageViewPage() {
  const params = useParams({ strict: false }) as { WageId: string }
  const [isLoading, setIsLoading] = useState(false)

  const { data: wage, isLoading: isQueryLoading, error } = useWageOrder(params.WageId)

  const { mutateAsync: downloadWage, isPending } = useDownloadWagePDF()

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadWage({ id: params.WageId })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${wage?.wageNumber || "WO"}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download Wage PDF:", error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isQueryLoading) {
    return (
      <>
        <Header />
        <Main>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </Main>
      </>
    )
  }

  if (error || !wage) {
    return (
      <>
        <Header />
        <Main>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
            <div className="mx-auto max-w-4xl">
              <Link
                to="/projects/$projectId/wages"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 mb-6"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Wages</span>
              </Link>
              <Card className="p-8 text-center">
                <p className="text-red-600 text-lg">Failed to load Wage order</p>
              </Card>
            </div>
          </div>
        </Main>
      </>
    )
  }

  // Calculate totals
  const subtotal = wage.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const tax = 0 // Assuming 0% tax based on the PDF
  const total = subtotal + tax

  return (
    <>
      <Header />
      <Main>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl">
            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/projects/$projectId/wages"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 w-fit"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm sm:text-base">Back to Wages</span>
              </Link>
              <div className="flex gap-2 print:hidden">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isLoading || isPending}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                >
                  <Download className="h-4 w-4" />
                  {isLoading || isPending ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </div>

            {/* Main Wage Card */}
            <Card className="overflow-hidden shadow-xl print:shadow-none bg-white">
              {/* Header - Matching PDF design */}
              <div className="border-b border-gray-300 px-6 py-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">WAGE ORDER</h1>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <p className="text-sm">Your Company Name</p>
                      <p className="text-sm">123 Business Street, Nairobi, Kenya</p>
                      <p className="text-sm">Phone: +254 700 000 000 | Email: info@company.com</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="space-y-2">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{wage.wageNumber}</p>
                        <p className="text-sm text-gray-600">WO Number</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{formatShortDate(wage.date)}</p>
                        <p className="text-sm text-gray-600">Date</p>
                      </div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusColor(wage.status)}`}
                      >
                        {wage.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {/* Payee Information - Similar to Vendor in PO */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">PAYEE</h2>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-gray-900">{wage.vendorName || wage.company}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Contact Person</p>
                        <p className="font-semibold text-gray-900">{wage.vendorContact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900 break-all">{wage.vendorEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{wage.vendorPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-900">{wage.vendorAddress || wage.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Period Information */}
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="border-l-4 border-blue-600 pl-4">
                    <p className="text-sm font-medium text-gray-600">Work Period Start</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(wage.date)}</p>
                  </div>
                  <div className="border-l-4 border-blue-600 pl-4">
                    <p className="text-sm font-medium text-gray-600">Work Period End</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(wage.deliveryDate)}</p>
                  </div>
                </div>

                {/* Bill To Information if available */}
                {wage.company && wage.company !== wage.vendorName && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-700 mb-3">Bill To</h3>
                    <div className="space-y-1 rounded-lg bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">{wage.company}</p>
                      <p className="text-sm text-gray-600">{wage.deliveryAddress}</p>
                    </div>
                  </div>
                )}

                {/* Items Table - Matching PDF table structure */}
                <div className="mb-8 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-900 bg-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">#</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">LABOR / SERVICE DESCRIPTION</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">WORKER ID</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-900">HOURS / DAYS</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">UNIT</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-900">RATE (KES)</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-900">AMOUNT (KES)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wage.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {/* Assuming worker ID might come from reference or item properties */}
                              {item.workerId || "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {item.unitPrice.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-blue-600">
                              {(item.quantity * item.unitPrice).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Section - Matching PDF layout */}
                <div className="mb-8">
                  <div className="flex justify-end">
                    <div className="w-full md:w-1/3 space-y-3">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-bold text-gray-700">SUBTOTAL</span>
                        <span className="font-bold text-gray-900">KES {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Tax (0%):</span>
                        <span className="text-gray-900">KES 0</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-xl font-bold text-gray-900">TOTAL WAGES</span>
                        <span className="text-2xl font-bold text-blue-600">KES {total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Terms & Conditions */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase text-gray-700 mb-3">PAYMENT TERMS & CONDITIONS</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>1. Please submit invoice along with timesheets for verification.</p>
                    <p>2. Payment terms: Net 30 days from receipt of verified invoice.</p>
                    <p>3. All hours/days must be verified by site supervisor.</p>
                    <p>4. Payment will be made upon completion of work and quality inspection.</p>
                    <p>5. Any discrepancies must be reported within 7 days of invoice receipt.</p>
                  </div>
                </div>

                {/* Notes if available */}
                {wage.notes && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-700 mb-3">NOTES</h3>
                    <p className="text-gray-600">{wage.notes}</p>
                  </div>
                )}

                {/* Signature/Acknowledgement Section */}
                <div className="border-t border-gray-300 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-bold uppercase text-gray-700 mb-4">PAYEE ACKNOWLEDGMENT</h3>
                      <div className="space-y-6">
                        <div className="border-t border-gray-400 pt-4">
                          <p className="text-sm text-gray-600 mb-1">Signature</p>
                          <div className="h-12"></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Name</p>
                          <p className="font-semibold text-gray-900">{wage.vendorContact}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="font-semibold text-gray-900">{formatShortDate(new Date().toISOString())}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold uppercase text-gray-700 mb-4">AUTHORIZED SIGNATURE</h3>
                      <div className="space-y-6">
                        <div className="border-t border-gray-400 pt-4">
                          <p className="text-sm text-gray-600 mb-1">Signature</p>
                          <div className="h-12"></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Name</p>
                          <p className="font-semibold text-gray-900">Site Supervisor / Project Manager</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="font-semibold text-gray-900">{formatShortDate(wage.date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System Generated Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>This is a system-generated wage order document. Authorized signatures may be required for approval.</p>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}