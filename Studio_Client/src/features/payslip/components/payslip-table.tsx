import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { Eye, Trash, Check, X, Plus, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axiosInstance from "@/lib/axios"

export type Payslip = {
  _id: string
  employeeName: string
  date: string
  grossPay: number
  totalDeductions: number
  netPay: number
  status: "draft" | "approved" | "declined"
  preparedBy: string
}

const usePayslips = (page = 1, limit = 10, search = "", sortBy = "date", sortOrder = "desc") => {
  return useQuery({
    queryKey: ["payslip", page, limit, search, sortBy, sortOrder],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/pay-slip", {
        params: { page, limit, search, sortBy, sortOrder },
      })
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

const usePayslipActions = () => {
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = React.useState(false)

  const performAction = React.useCallback(
    async (method: string, id: string, data?: any) => {
      setIsProcessing(true)
      try {
        if (method === "approve" || method === "decline") {
          await axiosInstance.patch(`/api/pay-slip/${id}`, {
            status: method === "approve" ? "approved" : "declined",
          })
        } else if (method === "delete") {
          await axiosInstance.delete(`/api/pay-slip/${id}`)
        }

        queryClient.invalidateQueries({ queryKey: ["payslip"] })
        setIsProcessing(false)
        return true
      } catch (error: any) {
        setIsProcessing(false)
        const message = error?.response?.data?.message || `Failed to ${method} payslip`
        toast.error(message)
        return false
      }
    },
    [queryClient],
  )

  return {
    approvePayslip: (id: string) => performAction("approve", id),
    declinePayslip: (id: string) => performAction("decline", id),
    deletePayslip: (id: string) => performAction("delete", id),
    isProcessing,
  }
}

const ConfirmDialog = React.memo(
  ({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    isLoading,
    isDangerous = false,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    onConfirm: () => void
    isLoading: boolean
    isDangerous?: boolean
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={isDangerous ? "destructive" : "default"} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
)

ConfirmDialog.displayName = "ConfirmDialog"

const getColumns = (
  onApprove: (id: string) => void,
  onDecline: (id: string) => void,
  onDelete: (id: string) => void,
  onView: (id: string) => void,
): ColumnDef<Payslip>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label={`Select row ${row.original.employeeName}`}
      />
    ),
    size: 50,
  },
  {
    accessorKey: "employeeName",
    header: "Employee",
    cell: ({ row }) => (
      <button
        onClick={() => onView(row.original._id)}
        className="text-blue-600 hover:underline cursor-pointer font-medium hover:text-blue-800 transition-colors"
        aria-label={`View payslip for ${row.getValue("employeeName")}`}
      >
        {row.getValue("employeeName")}
      </button>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
  },
{
  accessorKey: "grossPay",
  header: "Gross Pay",
  cell: ({ getValue }) => {
    const value = getValue() as number | undefined
    if (value === undefined || value === null) return "—"
    
    // Format as Kenyan currency with commas
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value)
  },
},

{
  accessorKey: "totalDeductions",
  header: "Deductions",
  cell: ({ getValue }) => {
    const value = getValue() as number | undefined
    return value !== undefined && value !== null
      ? new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          minimumFractionDigits: 2,
        }).format(value)
      : "—"
  },
},
{
  accessorKey: "netPay",
  header: "Net Pay",
  cell: ({ getValue }) => {
    const value = getValue() as number | undefined
    return value !== undefined && value !== null
      ? new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          minimumFractionDigits: 2,
        }).format(value)
      : "—"
  },
},
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as string
      const statusColors = {
        draft: "bg-gray-100 text-gray-800",
        approved: "bg-green-100 text-green-800",
        declined: "bg-red-100 text-red-800",
      }
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
  {
    accessorKey: "preparedBy",
    header: "Prepared By",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const slip = row.original
      return (
        <div className="flex gap-1">
          <button
            onClick={() => onView(slip._id)}
            title="View"
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="View payslip"
          >
            <Eye className="w-4 h-4" />
          </button>
          {slip.status === "draft" && (
            <>
              <button
                onClick={() => onApprove(slip._id)}
                title="Approve"
                className="p-1 hover:bg-green-100 rounded transition-colors"
                aria-label="Approve payslip"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={() => onDecline(slip._id)}
                title="Decline"
                className="p-1 hover:bg-red-100 rounded transition-colors"
                aria-label="Decline payslip"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(slip._id)}
            title="Delete"
            className="p-1 hover:bg-red-100 rounded transition-colors"
            aria-label="Delete payslip"
          >
            <Trash className="w-4 h-4 text-red-700" />
          </button>
        </div>
      )
    },
    size: 120,
  },
]

export const PayslipTable = React.memo(function PayslipTableComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "date", desc: true }])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [searchTerm, setSearchTerm] = React.useState("")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean
    action?: "approve" | "decline" | "delete"
    payslipId?: string
  }>({ open: false })

  const sortBy = sorting[0]?.id || "date"
  const sortOrder = sorting[0]?.desc ? "desc" : "asc"

  const getPayslipsQuery = React.useCallback(
    () => usePayslips(pagination.pageIndex + 1, pagination.pageSize, searchTerm, sortBy, sortOrder),
    [pagination.pageIndex, pagination.pageSize, searchTerm, sortBy, sortOrder],
  )

  const { data: apiResponse, isLoading, error, refetch } = getPayslipsQuery()

  const payslips =
  apiResponse?.map((item: any) => ({
    _id: item._id,
    employeeName: item.employeeName,
    date: item.date,
    grossPay: item.grossPay,
    totalDeductions: item.calculations?.totalDeductions ?? 0,
    netPay: item.calculations?.netPay ?? 0,
    status: item.status,
    preparedBy: item.preparedBy,
  })) || []

  const totalPages = apiResponse?.pagination?.pages || 0

  const { approvePayslip, declinePayslip, deletePayslip, isProcessing } = usePayslipActions()

  const handleViewPayslip = React.useCallback(
    (id: string) => {
      navigate({ to: `${id}` })
    },
    [navigate],
  )

  const handleApprove = React.useCallback((id: string) => {
    setConfirmDialog({ open: true, action: "approve", payslipId: id })
  }, [])

  const handleDecline = React.useCallback((id: string) => {
    setConfirmDialog({ open: true, action: "decline", payslipId: id })
  }, [])

  const handleDelete = React.useCallback((id: string) => {
    setConfirmDialog({ open: true, action: "delete", payslipId: id })
  }, [])

  const columns = getColumns(handleApprove, handleDecline, handleDelete, handleViewPayslip)

  const table = useReactTable({
    data: payslips,
    columns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    manualPagination: true,
    pageCount: totalPages,
  })

  const handleConfirm = React.useCallback(async () => {
    if (!confirmDialog.action || !confirmDialog.payslipId) return

    let success = false
    if (confirmDialog.action === "approve") {
      success = await approvePayslip(confirmDialog.payslipId)
    } else if (confirmDialog.action === "decline") {
      success = await declinePayslip(confirmDialog.payslipId)
    } else if (confirmDialog.action === "delete") {
      success = await deletePayslip(confirmDialog.payslipId)
    }

    if (success) {
      setConfirmDialog({ open: false })
      refetch()
    }
  }, [confirmDialog, approvePayslip, declinePayslip, deletePayslip, refetch])

  const confirmDialogConfig = {
    approve: {
      title: "Approve Payslip",
      description: "Are you sure you want to approve this payslip?",
      isDangerous: false,
    },
    decline: {
      title: "Decline Payslip",
      description: "Are you sure you want to decline this payslip?",
      isDangerous: true,
    },
    delete: {
      title: "Delete Payslip",
      description: "Are you sure you want to delete this payslip? This action cannot be undone.",
      isDangerous: true,
    },
  }

  const currentConfig = confirmDialogConfig[confirmDialog.action as keyof typeof confirmDialogConfig]

  return (
    <div className="w-full space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Payslips</h2>
        <Button onClick={() => navigate({ to: "/projects/$projectId/payslip/new/" })}>
          <Plus className="w-4 h-4 mr-2" />
          Create Payslip
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load payslips. Please try again.</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <Input
          placeholder="Search by employee name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPagination({ ...pagination, pageIndex: 0 })
          }}
          className="flex-1"
          disabled={isLoading}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="cursor-pointer whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : payslips.length ? (
              payslips.map((row) => (
                <TableRow key={row._id} className="hover:bg-gray-50 transition-colors">
                  {table
                    .getRowModel()
                    .rows.find((r) => r.original._id === row._id)
                    ?.getVisibleCells()
                    .map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No payslips found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Page {pagination.pageIndex + 1} of {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
            disabled={pagination.pageIndex === 0 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, pageIndex: pagination.pageIndex + 1 })}
            disabled={pagination.pageIndex + 1 >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {currentConfig && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={currentConfig.title}
          description={currentConfig.description}
          onConfirm={handleConfirm}
          isLoading={isProcessing}
          isDangerous={currentConfig.isDangerous}
        />
      )}
    </div>
  )
})
