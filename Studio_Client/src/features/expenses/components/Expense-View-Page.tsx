"use client"

import { useState } from "react"
import { useParams, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, ArrowLeft, Loader2, FileText, Receipt } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { useExpenseOrder } from "@/hooks/use-expense-order"
import { useDownloadExpensePDF } from "@/hooks/PDFs/Expense-order-PDF"

export default function EXPViewPage() {
  const params = useParams({ strict: false }) as { ExpenseId: string }
  const [isLoading, setIsLoading] = useState(false)

  const { data: expense, isLoading: isQueryLoading, error } = useExpenseOrder(params.ExpenseId)

  const { mutateAsync: downloadExpense, isPending } = useDownloadExpensePDF()

  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadExpense({ id: params.ExpenseId })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${expense?.expenseNumber || "Expense"}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download Expense PDF:", error)
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

  // Helper function to handle attachment viewing/downloading
  const handleViewAttachment = (attachment: any) => {
    // Assuming attachment has a storedName and upload path
    const attachmentUrl = `${window.location.origin}/uploads/expenses/${new Date().toISOString().split('T')[0]}/${attachment.storedName}`
    window.open(attachmentUrl, '_blank')
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (mimeType.includes('image')) return <FileText className="h-4 w-4 text-blue-500" />
    if (mimeType.includes('word')) return <FileText className="h-4 w-4 text-blue-600" />
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileText className="h-4 w-4 text-green-600" />
    return <FileText className="h-4 w-4 text-gray-500" />
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

  if (error || !expense) {
    return (
      <>
        <Header />
        <Main>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
            <div className="mx-auto max-w-4xl">
              <Link
                to="/projects/$projectId/expenses"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 mb-6"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Expenses</span>
              </Link>
              <Card className="p-8 text-center">
                <p className="text-red-600 text-lg">Failed to load Expense order</p>
              </Card>
            </div>
          </div>
        </Main>
      </>
    )
  }

  // Calculate totals
  const subtotal = expense.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
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
                to="/projects/$projectId/expenses"
                className="inline-flex items-center gap-2 text-primary hover:opacity-80 w-fit"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm sm:text-base">Back to Expenses</span>
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

            {/* Main Expense Card */}
            <Card className="overflow-hidden shadow-xl print:shadow-none bg-white">
              {/* Header - Matching PDF design */}
              <div className="border-b border-gray-300 px-6 py-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">EXPENSE ORDER</h1>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <p className="text-sm">Your Company Name</p>
                      <p className="text-sm">123 Business Street, Nairobi, Kenya</p>
                      <p className="text-sm">Phone: +254 700 000 000 | Email: info@company.com</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="space-y-2">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{expense.expenseNumber}</p>
                        <p className="text-sm text-gray-600">EO Number</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{formatShortDate(expense.date)}</p>
                        <p className="text-sm text-gray-600">Expense Date</p>
                      </div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusColor(expense.status)}`}
                      >
                        {expense.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {/* Expense Information Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    EXPENSE DETAILS
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="border-l-4 border-blue-600 pl-4">
                      <p className="text-sm font-medium text-gray-600">Expense Date</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(expense.date)}</p>
                    </div>
                    <div className="border-l-4 border-blue-600 pl-4">
                      <p className="text-sm font-medium text-gray-600">Reporting Date</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(expense.deliveryDate || expense.date)}</p>
                    </div>
                  </div>
                </div>

                {/* Expense Category/Type if available */}
                {expense.category && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-700 mb-3">Expense Category</h3>
                    <div className="inline-block rounded-lg bg-blue-50 px-4 py-2">
                      <p className="font-semibold text-blue-700">{expense.category}</p>
                    </div>
                  </div>
                )}

                {/* Vendor/Supplier Information */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">SUPPLIER / VENDOR</h2>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-gray-900">{expense.vendorName}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Contact Person</p>
                        <p className="font-semibold text-gray-900">{expense.vendorContact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900 break-all">{expense.vendorEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{expense.vendorPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-900">{expense.vendorAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project/Department Information if available */}
                {expense.company && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-700 mb-3">Project / Department</h3>
                    <div className="space-y-1 rounded-lg bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">{expense.company}</p>
                      {expense.deliveryAddress && (
                        <p className="text-sm text-gray-600">{expense.deliveryAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Table - Expense specific structure */}
                <div className="mb-8 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-900 bg-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">#</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">EXPENSE ITEM</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">CATEGORY</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-900">QTY</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-900">UNIT</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-900">UNIT PRICE (KES)</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-900">AMOUNT (KES)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expense.items.map((item, index) => (
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
                              {item.category || expense.category || "General"}
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

                {/* Totals Section */}
                <div className="mb-8">
                  <div className="flex justify-end">
                    <div className="w-full md:w-1/3 space-y-3">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-bold text-gray-700">EXPENSE SUBTOTAL</span>
                        <span className="font-bold text-gray-900">KES {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Tax (0%):</span>
                        <span className="text-gray-900">KES 0</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-xl font-bold text-gray-900">TOTAL EXPENSE</span>
                        <span className="text-2xl font-bold text-blue-600">KES {total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receipts/Attachments Section */}
                {expense.attachments && expense.attachments.length > 0 && (
                  <div className="mb-8 rounded-lg bg-blue-50 p-6 border border-blue-200">
                    <h3 className="mb-4 font-bold uppercase text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      RECEIPTS & SUPPORTING DOCUMENTS
                      <span className="ml-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                        {expense.attachments.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {expense.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg bg-white p-3 border">
                          <div className="flex items-center gap-3">
                            {getFileIcon(attachment.mimeType)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(attachment.uploadedAt || new Date()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAttachment(attachment)}
                            className="gap-1 text-xs"
                          >
                            <FileText className="h-3 w-3" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expense Approval Terms */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase text-gray-700 mb-3">EXPENSE APPROVAL TERMS</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>1. All expenses must be supported by original receipts or invoices.</p>
                    <p>2. Expense reports must be submitted within 7 days of the expense date.</p>
                    <p>3. Unusual or large expenses require prior approval.</p>
                    <p>4. Reimbursement will be processed within 14 days of approval.</p>
                    <p>5. All expenses must comply with company expense policy.</p>
                  </div>
                </div>

                {/* Notes if available */}
                {expense.notes && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-700 mb-3">EXPENSE JUSTIFICATION / NOTES</h3>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-gray-600">{expense.notes}</p>
                    </div>
                  </div>
                )}

                {/* Authorization Section */}
                <div className="border-t border-gray-300 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <h3 className="text-sm font-bold uppercase text-gray-700 mb-4">EXPENSE SUBMITTED BY</h3>
                      <div className="space-y-6">
                        <div className="border-t border-gray-400 pt-4">
                          <p className="text-sm text-gray-600 mb-1">Signature</p>
                          <div className="h-12"></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Name</p>
                          <p className="font-semibold text-gray-900">{expense.vendorContact || "Employee"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="font-semibold text-gray-900">{formatShortDate(expense.date)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold uppercase text-gray-700 mb-4">SUPERVISOR APPROVAL</h3>
                      <div className="space-y-6">
                        <div className="border-t border-gray-400 pt-4">
                          <p className="text-sm text-gray-600 mb-1">Signature</p>
                          <div className="h-12"></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Name</p>
                          <p className="font-semibold text-gray-900">Supervisor / Manager</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="font-semibold text-gray-900">{formatShortDate(new Date().toISOString())}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase text-gray-700 mb-4">FINANCE APPROVAL</h3>
                      <div className="space-y-6">
                        <div className="border-t border-gray-400 pt-4">
                          <p className="text-sm text-gray-600 mb-1">Signature</p>
                          <div className="h-12"></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Name</p>
                          <p className="font-semibold text-gray-900">Finance Officer</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="font-semibold text-gray-900">{formatShortDate(new Date().toISOString())}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System Generated Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>This is a system-generated expense order document. Authorized signatures are required for processing and reimbursement.</p>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}