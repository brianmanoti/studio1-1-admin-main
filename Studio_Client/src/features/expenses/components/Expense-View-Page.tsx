"use client"

import { useState } from "react"
import { useParams, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { useDownloadPOPDF } from "@/hooks/PDFs/purchase-order-PDF"
import { usePurchaseOrder } from "@/hooks/use-purchase-order"

export default function EXPViewPage() {
  const params = useParams({ strict: false }) as { purchaseId: string }
  const [isLoading, setIsLoading] = useState(false)

  const { data: po, isLoading: isQueryLoading, error } = usePurchaseOrder(params.purchaseId)

  const { mutateAsync: downloadPO, isPending } = useDownloadPOPDF()

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadPO({ id: params.purchaseId })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${po?.poNumber || "PO"}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download PO PDF:", error)
    }
  }

  const handlePrint = () => {
    window.print()
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

  if (error || !po) {
    return (
      <>
        <Header />
        <Main>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
            <div className="mx-auto max-w-4xl">
              <Link
                to="/_authenticated/projects"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 mb-6"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Projects</span>
              </Link>
              <Card className="p-8 text-center">
                <p className="text-red-600 text-lg">Failed to load purchase order</p>
              </Card>
            </div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header />
      <Main>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <Link
                to="/_authenticated/projects"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Projects</span>
              </Link>
              <div className="flex gap-3 print:hidden">
                <Button variant="outline" onClick={handlePrint} className="gap-2 bg-transparent">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isLoading || isPending}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  {isLoading || isPending ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden shadow-xl print:shadow-none">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Purchase Order</h1>
                    <p className="mt-1 text-blue-100">Professional Procurement Document</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{po.poNumber}</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${getStatusColor(po.status)}`}
                    >
                      {po.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-8 grid grid-cols-2 gap-8">
                  <div className="border-l-4 border-blue-600 pl-4">
                    <p className="text-sm font-medium text-slate-600">Date Issued</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatDate(po.date)}</p>
                  </div>
                  <div className="border-l-4 border-blue-600 pl-4">
                    <p className="text-sm font-medium text-slate-600">Delivery Date</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatDate(po.deliveryDate)}</p>
                  </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase text-slate-700">From</h3>
                    <div className="space-y-2 rounded-lg bg-blue-50 p-4">
                      <p className="font-semibold text-slate-900">Your Company</p>
                      <p className="text-sm text-slate-600">Contact details</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase text-slate-700">Bill To</h3>
                    <div className="space-y-2 rounded-lg bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{po.company}</p>
                      <p className="text-sm text-slate-600">{po.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8 rounded-lg bg-blue-50 p-6">
                  <h3 className="mb-4 font-bold uppercase text-slate-700">Vendor Information</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-slate-600">Vendor Name</p>
                      <p className="mt-1 font-semibold text-slate-900">{po.vendorName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">Contact Person</p>
                      <p className="mt-1 font-semibold text-slate-900">{po.vendorContact}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">Email</p>
                      <p className="mt-1 font-semibold text-slate-900">{po.vendorEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">Phone</p>
                      <p className="mt-1 font-semibold text-slate-900">{po.vendorPhone}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-600">Address</p>
                    <p className="mt-1 font-semibold text-slate-900">{po.vendorAddress}</p>
                  </div>
                </div>

                <div className="mb-8 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-blue-600 bg-blue-50">
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-900">Item</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-900">Description</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-900">Qty</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-900">Unit</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-slate-900">Unit Price</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-slate-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.description}</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-slate-900">{item.unit}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            KES {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">{`KES ${(item.quantity * item.unitPrice).toLocaleString()}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mb-8 flex justify-end">
                  <div className="w-full max-w-sm space-y-3 rounded-lg bg-gradient-to-br from-blue-50 to-slate-50 p-6">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold text-slate-900">KES {po.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tax (0%):</span>
                      <span className="font-semibold text-slate-900">KES 0</span>
                    </div>
                    <div className="border-t-2 border-blue-600 pt-3 flex justify-between">
                      <span className="font-bold text-slate-900">Total Amount Due:</span>
                      <span className="text-2xl font-bold text-blue-600">KES {po.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {po.notes && (
                  <div className="mb-8 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-700">Notes:</p>
                    <p className="mt-2 text-slate-600">{po.notes}</p>
                  </div>
                )}

                <div className="border-t-2 border-slate-200 pt-6 text-center text-xs text-slate-500">
                  <p>This is a system-generated document. Authorized signatures may be required for approval.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
