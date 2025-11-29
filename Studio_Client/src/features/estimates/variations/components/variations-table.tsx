import * as React from "react"
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  Table as TanTable,
} from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Eye, Trash, Check, X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableToolbar, DataTablePagination } from "@/components/data-table"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useNavigate } from "@tanstack/react-router"
import {
  approveVariation,
  deleteVariation,
  fetchVariations,
  rejectVariation,
} from "@/hooks/Variations/variations"
import { useProjectStore } from "@/stores/projectStore"
import { toast } from "sonner"

// --------------------- Types ---------------------
export type Variation = {
  variationId: string
  name: string
  projectId: { _id: string; name: string }
  estimateId: string
  date: string
  status: "Pending Approval" | "Approved" | "Rejected"
  description?: string
  notes?: string
  groups: any[]
  amount: number
  total: number
  spent: number
  balance: number
}

// --------------------- Helpers ---------------------
function computeTotals(groups: any[]) {
  const totals = groups.reduce(
    (acc, g) => {
      acc.amount += g.amount || 0
      acc.total += g.total || 0
      acc.spent += g.spent || 0
      acc.balance += g.balance || 0
      return acc
    },
    { amount: 0, total: 0, spent: 0, balance: 0 }
  )
  return totals
}

// --------------------- Bulk Actions ---------------------
function VariationBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: TanTable<Variation>
  onBulkApprove: (rows: Variation[]) => void
  onBulkReject: (rows: Variation[]) => void
  onBulkDelete: (rows: Variation[]) => void
}) {
  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: "approve" | "reject" | "delete"
  }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.action) return
    if (dialog.action === "approve") onBulkApprove(selected)
    if (dialog.action === "reject") onBulkReject(selected)
    if (dialog.action === "delete") onBulkDelete(selected)
    setDialog({ open: false })
  }

  if (selected.length === 0) return null

  return (
    <div className="flex gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" onClick={() => setDialog({ open: true, action: "approve" })}>
        Approve
      </Button>
      <Button size="sm" onClick={() => setDialog({ open: true, action: "reject" })}>
        Reject
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setDialog({ open: true, action: "delete" })}
      >
        Delete
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === "delete"
            ? "Delete Variations"
            : dialog.action === "approve"
            ? "Approve Variations"
            : "Reject Variations"
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} variation(s)?`}
        destructive={dialog.action === "delete" || dialog.action === "reject"}
        handleConfirm={handleConfirm}
        confirmText={
          dialog.action === "delete"
            ? "Delete"
            : dialog.action === "approve"
            ? "Approve"
            : "Reject"
        }
      />
    </div>
  )
}

// --------------------- Table Columns ---------------------
function getColumns(
  projectId: string,
  navigate: ReturnType<typeof useNavigate>,
  handleConfirmAction: (id: string, action: "approve" | "reject" | "delete") => void
): ColumnDef<Variation>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
      ),
    },
    { accessorKey: "variationId", header: "Variation ID" },
    { accessorKey: "name", header: "Name" },
    {
      accessorFn: (row) => row.projectId?.name || "N/A",
      id: "project",
      header: "Project",
    },
    { accessorKey: "estimateId", header: "Estimate" },
    { accessorKey: "date", header: "Date" },
    {
      accessorFn: (row) => computeTotals(row.groups).amount,
      id: "amount",
      header: "Amount",
      cell: ({ getValue }) => `KES ${getValue().toLocaleString()}`,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const v = row.original
        const [approveDialog, setApproveDialog] = React.useState(false)
        const [rejectDialog, setRejectDialog] = React.useState(false)
        const [deleteDialog, setDeleteDialog] = React.useState(false)

        const isApproved = v.status === "Approved"
        const isRejected = v.status === "Rejected"
        const isPending = v.status === "Pending Approval"

        return (
          <div className="flex gap-2 items-center">
            {/* View always available */}
            <button
              onClick={() =>
                navigate({
                  to: `/projects/${projectId}/estimates/variations/${v.variationId}`,
                })
              }
            >
              <Eye className="w-4 h-4 text-blue-600" />
            </button>

            {/* Approve / Reject only if Pending */}
            {isPending && (
              <>
                <button onClick={() => setApproveDialog(true)}>
                  <Check className="w-4 h-4 text-green-600" />
                </button>
                <button onClick={() => setRejectDialog(true)}>
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </>
            )}

            {/* Delete always available */}
            <button onClick={() => setDeleteDialog(true)}>
              <Trash className="w-4 h-4 text-red-700" />
            </button>

            {/* Approve Confirmation Dialog */}
            <ConfirmDialog
              open={approveDialog}
              onOpenChange={setApproveDialog}
              title="Approve Variation"
              desc="Are you sure you want to approve this variation?"
              handleConfirm={() => {
                handleConfirmAction(v.variationId, "approve")
                setApproveDialog(false)
              }}
              confirmText="Approve"
            />

            {/* Reject Confirmation Dialog */}
            <ConfirmDialog
              open={rejectDialog}
              onOpenChange={setRejectDialog}
              title="Reject Variation"
              desc="Are you sure you want to reject this variation?"
              destructive
              handleConfirm={() => {
                handleConfirmAction(v.variationId, "reject")
                setRejectDialog(false)
              }}
              confirmText="Reject"
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
              open={deleteDialog}
              onOpenChange={setDeleteDialog}
              title="Delete Variation"
              desc="Are you sure you want to delete this variation? This action cannot be undone."
              destructive
              handleConfirm={() => {
                handleConfirmAction(v.variationId, "delete")
                setDeleteDialog(false)
              }}
              confirmText="Delete"
            />
          </div>
        )
      },
    },
  ]
}

// --------------------- Main Component ---------------------
export function VariationTable() {
  const projectId = useProjectStore((state) => state.projectId)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["variations", projectId],
    queryFn: () => fetchVariations(projectId),
    enabled: !!projectId,
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to load variations")
    },
  })

  // --- Mutations ---
  const approveMutation = useMutation({
    mutationFn: approveVariation,
    onSuccess: () => {
      toast.success("Variation approved successfully")
      queryClient.invalidateQueries({ queryKey: ["variations", projectId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to approve variation")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectVariation,
    onSuccess: () => {
      toast.info("Variation rejected")
      queryClient.invalidateQueries({ queryKey: ["variations", projectId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reject variation")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVariation,
    onSuccess: () => {
      toast.success("Variation deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["variations", projectId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete variation")
    },
  })

  const handleConfirmAction = (id: string, action: "approve" | "reject" | "delete") => {
    if (action === "approve") {
      approveMutation.mutate(id)
    } else if (action === "reject") {
      rejectMutation.mutate(id)
    } else if (action === "delete") {
      deleteMutation.mutate(id)
    }
  }

  // --- Table setup ---
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data: data ?? [],
    columns: getColumns(projectId, navigate, handleConfirmAction),
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading variations...
      </div>
    )

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <p className="text-red-600 mb-2">Failed to load variations.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )

  if (!data?.length)
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
        <p>No variations found.</p>
        <Button onClick={() => navigate({ to: `/projects/${projectId}/estimates/variations/new` })}>
          <Plus className="w-4 h-4 mr-2" /> Add Variation
        </Button>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <DataTableToolbar table={table} searchPlaceholder="Search variations..." />
        <Button onClick={() => navigate({ to: `/projects/${projectId}/estimates/variations/new` })}>
          <Plus className="w-4 h-4 mr-2" /> Add Variation
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <VariationBulkActions
        table={table}
        onBulkApprove={(rows) => rows.forEach((r) => approveMutation.mutate(r.variationId))}
        onBulkReject={(rows) => rows.forEach((r) => rejectMutation.mutate(r.variationId))}
        onBulkDelete={(rows) => rows.forEach((r) => deleteMutation.mutate(r.variationId))}
      />
    </div>
  )
}