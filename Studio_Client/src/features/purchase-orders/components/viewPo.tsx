import { useState } from "react"
import { useParams, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, ArrowLeft, Loader2, Paperclip, Eye, FileText, X, User, Building } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { useDownloadPOPDF } from "@/hooks/PDFs/purchase-order-PDF"
import { usePurchaseOrder } from "@/hooks/use-purchase-order"

export default function POViewPage() {
  const params = useParams({ strict: false }) as { purchaseId: string }
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null)

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

  const handleViewAttachment = (attachment: any) => {
    // Use the storedName for the file path
    const attachmentUrl = `${window.location.origin}/uploads/expenses/2025-11-28/${attachment.storedName}`
    window.open(attachmentUrl, '_blank')
  }

  const handleDownloadAttachment = (attachment: any) => {
    const attachmentUrl = `${window.location.origin}/uploads/expenses/2025-11-28/${attachment.storedName}`
    const a = document.createElement("a")
    a.href = attachmentUrl
    a.download = attachment.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (mimeType.includes('image')) return <FileText className="h-4 w-4 text-blue-500" />
    if (mimeType.includes('word')) return <FileText className="h-4 w-4 text-blue-600" />
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileText className="h-4 w-4 text-green-600" />
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
                to="/projects/$projectId/purchaseOrders"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 mb-6"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Purchase Order</span>
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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/projects/$projectId/purchaseOrders"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 w-fit"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm sm:text-base">Back to Purchase Orders</span>
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

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main PO Content - 3/4 width on xl screens */}
              <div className="xl:col-span-3">
                <Card className="overflow-hidden shadow-xl print:shadow-none">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-8 py-6 sm:py-8 text-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Purchase Order</h1>
                        <p className="mt-1 text-blue-100 text-sm sm:text-base">Professional Procurement Document</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xl sm:text-2xl font-bold">{po.poNumber}</p>
                        <span
                          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs sm:text-sm font-semibold capitalize ${getStatusColor(po.status)}`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-8">
                    {/* Date Information */}
                    <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div className="border-l-4 border-blue-600 pl-4">
                        <p className="text-sm font-medium text-slate-600">Date Issued</p>
                        <p className="mt-1 text-base sm:text-lg font-semibold text-slate-900">{formatDate(po.date)}</p>
                      </div>
                      <div className="border-l-4 border-blue-600 pl-4">
                        <p className="text-sm font-medium text-slate-600">Delivery Date</p>
                        <p className="mt-1 text-base sm:text-lg font-semibold text-slate-900">{formatDate(po.deliveryDate)}</p>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <h3 className="mb-3 text-sm font-bold uppercase text-slate-700">From</h3>
                        <div className="space-y-2 rounded-lg bg-blue-50 p-3 sm:p-4">
                          <p className="font-semibold text-slate-900">Your Company</p>
                          <p className="text-sm text-slate-600">Contact details</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-3 text-sm font-bold uppercase text-slate-700">Bill To</h3>
                        <div className="space-y-2 rounded-lg bg-slate-50 p-3 sm:p-4">
                          <p className="font-semibold text-slate-900">{po.company}</p>
                          <p className="text-sm text-slate-600">{po.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subcontractor Information */}
                    {po.subcontractorId && (
                      <div className="mb-6 sm:mb-8 rounded-lg bg-green-50 p-4 sm:p-6 border border-green-200">
                        <h3 className="mb-4 font-bold uppercase text-slate-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Subcontractor Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-slate-600">Company Name</p>
                            <p className="mt-1 font-semibold text-slate-900">{po.subcontractorId.companyName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-600">Email</p>
                            <p className="mt-1 font-semibold text-slate-900">{po.subcontractorId.email}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-600">Contact Person</p>
                            <p className="mt-1 font-semibold text-slate-900">{po.subcontractorId.contactPerson}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-600">Contact PhoneNumber</p>
                            <p className="mt-1 font-semibold text-slate-900">{po.subcontractorId.phoneNumber}</p>
                          </div>
                          <div className="sm:col-span-2 lg:col-span-1">
                            <p className="text-xs font-medium text-slate-600">Reference ID</p>
                            <p className="mt-1 font-semibold text-slate-900">{po.subcontractorId._id}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Vendor Information */}
                    <div className="mb-6 sm:mb-8 rounded-lg bg-blue-50 p-4 sm:p-6">
                      <h3 className="mb-4 font-bold uppercase text-slate-700 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Vendor Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          <p className="mt-1 font-semibold text-slate-900 break-all">{po.vendorEmail}</p>
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

                    {/* Items Table */}
                    <div className="mb-6 sm:mb-8 overflow-x-auto">
                      <div className="min-w-[600px]">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-blue-600 bg-blue-50">
                              <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-bold text-slate-900">Item</th>
                              <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-bold text-slate-900">Description</th>
                              <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-bold text-slate-900">Qty</th>
                              <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-bold text-slate-900">Unit</th>
                              <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-bold text-slate-900">Unit Price</th>
                              <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-bold text-slate-900">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {po.items.map((item, index) => (
                              <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-900 text-sm">{item.name}</td>
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">{item.description}</td>
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-center font-semibold text-slate-900 text-sm">{item.quantity}</td>
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-900 text-sm">{item.unit}</td>
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-right font-semibold text-slate-900 text-sm">
                                  KES {item.unitPrice.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-right font-semibold text-blue-600 text-sm">
                                  KES {(item.quantity * item.unitPrice).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="mb-6 sm:mb-8 flex justify-end">
                      <div className="w-full max-w-sm space-y-3 rounded-lg bg-gradient-to-br from-blue-50 to-slate-50 p-4 sm:p-6">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="font-semibold text-slate-900">KES {po.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-slate-600">Tax (0%):</span>
                          <span className="font-semibold text-slate-900">KES 0</span>
                        </div>
                        <div className="border-t-2 border-blue-600 pt-3 flex justify-between text-sm sm:text-base">
                          <span className="font-bold text-slate-900">Total Amount Due:</span>
                          <span className="text-xl sm:text-2xl font-bold text-blue-600">KES {po.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {po.notes && (
                      <div className="mb-6 sm:mb-8 rounded-lg bg-slate-50 p-3 sm:p-4">
                        <p className="text-sm font-bold text-slate-700">Notes:</p>
                        <p className="mt-2 text-slate-600 text-sm">{po.notes}</p>
                      </div>
                    )}

                    <div className="border-t-2 border-slate-200 pt-4 sm:pt-6 text-center text-xs text-slate-500">
                      <p>This is a system-generated document. Authorized signatures may be required for approval.</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Attachments Sidebar - 1/4 width on xl screens */}
              {po.attachments && po.attachments.length > 0 && (
                <div className="xl:col-span-1">
                  <Card className="shadow-xl sticky top-6">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 sm:px-6 py-3 sm:py-4 text-white">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                        <h2 className="text-base sm:text-lg font-bold">Attachments</h2>
                        <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold">
                          {po.attachments.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-4">
                      <div className="space-y-3">
                        {po.attachments.map((attachment) => (
                          <div
                            key={attachment._id}
                            className="rounded-lg border border-slate-200 p-3 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getFileIcon(attachment.mimeType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-slate-900 truncate" title={attachment.fileName}>
                                  {attachment.fileName}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                                  <span>{formatFileSize(attachment.size)}</span>
                                  <span>•</span>
                                  <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAttachment(attachment)}
                                className="flex-1 gap-1 text-xs h-8"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="flex-1 gap-1 text-xs h-8"
                              >
                                <Download className="h-3 w-3" />
                                Get File
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {po.attachments.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Download all attachments as zip (you would implement this)
                              alert("Download all as ZIP feature would be implemented here")
                            }}
                            className="w-full gap-2 text-xs h-9"
                          >
                            <Download className="h-3 w-3" />
                            Get All Files
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}