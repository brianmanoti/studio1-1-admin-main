'use client'

import * as React from 'react'
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
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Check, X, Trash, Plus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTableToolbar, DataTablePagination } from '@/components/data-table'
import { useNavigate } from '@tanstack/react-router'
import axiosInstance from '@/lib/axios'
import { toast } from 'sonner'

/** Expense type */
export type Expense = {
  _id: string
  expenseNumber: string
  company: string
  vendorName: string
  status: 'pending' | 'in-transit' | 'delivered' | 'declined' | 'approved'
  date: string
  deliveryDate: string
  amount: number
}

/** Bulk actions bar */
function ExpensesBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: TanTable<Expense>
  onBulkApprove?: (rows: Expense[]) => void
  onBulkReject?: (rows: Expense[]) => void
  onBulkDelete?: (rows: Expense[]) => void
}) {
  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'delete'
  }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.action) return
    if (dialog.action === 'approve') onBulkApprove?.(selected)
    if (dialog.action === 'reject') onBulkReject?.(selected)
    if (dialog.action === 'delete') onBulkDelete?.(selected)
    setDialog({ open: false })
  }

  if (selected.length === 0) return null

  return (
    <div className="flex gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'approve' })}>
        Approve
      </Button>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'reject' })}>
        Reject
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setDialog({ open: true, action: 'delete' })}
      >
        Delete
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? 'Delete Expenses'
            : dialog.action === 'approve'
            ? 'Approve Expenses'
            : 'Reject Expenses'
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} expense(s)?`}
        destructive={dialog.action === 'delete' || dialog.action === 'reject'}
        handleConfirm={handleConfirm}
        confirmText={
          dialog.action === 'delete'
            ? 'Delete'
            : dialog.action === 'approve'
            ? 'Approve'
            : 'Reject'
        }
      />
    </div>
  )
}

/** Columns with row actions */
function getColumns({
  onView,
  onEdit,
  onApproveConfirm,
  onRejectConfirm,
  onDeleteConfirm,
}: {
  onView?: (e: Expense) => void
  onEdit?: (e: Expense) => void
  onApproveConfirm?: (e: Expense) => void
  onRejectConfirm?: (e: Expense) => void
  onDeleteConfirm?: (e: Expense) => void
}): ColumnDef<Expense>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    { accessorKey: 'expenseNumber', header: 'Expense #' },
    { accessorKey: 'company', header: 'Company' },
    { accessorKey: 'vendorName', header: 'Vendor' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'date', header: 'Date',  cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-KE'), },
    { accessorKey: 'deliveryDate', header: 'Delivery',  cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-KE'), },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => `KES ${(getValue() as number).toLocaleString()}`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const exp = row.original
        return (
          <div className="flex gap-2">
            <button onClick={() => onView?.(exp)} title="View">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit?.(exp)} title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onApproveConfirm?.(exp)} title="Approve">
              <Check className="w-4 h-4 text-green-600" />
            </button>
            <button onClick={() => onRejectConfirm?.(exp)} title="Reject">
              <X className="w-4 h-4 text-red-600" />
            </button>
            <button onClick={() => onDeleteConfirm?.(exp)} title="Delete">
              <Trash className="w-4 h-4 text-red-700" />
            </button>
          </div>
        )
      },
    },
  ]
}

/** ✅ Main Expenses Table Component */
export function ExpensesTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [dialog, setDialog] = React.useState<{ open: boolean; action?: 'approve' | 'reject' | 'delete'; expense?: Expense }>({ open: false })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const projectId = '68de8b6a157949fa127747a1'

  // ✅ Fetch expenses
  const {
    data: expenses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['expensesList'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/expenses')
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })

  // ✅ Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/expenses/${id}/approve`),
    onSuccess: () => {
      toast.success('Expense approved successfully')
      queryClient.invalidateQueries({ queryKey: ['expensesList'] })
    },
    onError: () => toast.error('Failed to approve expense'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/expenses/${id}/reject`),
    onSuccess: () => {
      toast.success('Expense rejected successfully')
      queryClient.invalidateQueries({ queryKey: ['expensesList'] })
    },
    onError: () => toast.error('Failed to reject expense'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['expensesList'] })
    },
    onError: () => toast.error('Failed to delete expense'),
  })

  const handleConfirm = () => {
    const { action, expense } = dialog
    if (!action || !expense) return

    if (action === 'approve') approveMutation.mutate(expense._id)
    if (action === 'reject') rejectMutation.mutate(expense._id)
    if (action === 'delete') deleteMutation.mutate(expense._id)

    setDialog({ open: false })
  }

  const table = useReactTable({
    data: expenses,
    columns: getColumns({
      onView: (e) => navigate({ to: `/projects/${projectId}/subcontractors/expenses/${e._id}` }),
      onEdit: (e) => navigate({ to: `/projects/${projectId}/subcontractors/expenses/${e._id}/edit` }),
      onApproveConfirm: (e) => setDialog({ open: true, action: 'approve', expense: e }),
      onRejectConfirm: (e) => setDialog({ open: true, action: 'reject', expense: e }),
      onDeleteConfirm: (e) => setDialog({ open: true, action: 'delete', expense: e }),
    }),
    state: { sorting, columnVisibility, rowSelection },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  if (isLoading) return <div>Loading expenses...</div>
  if (isError) return <div>Failed to load expenses.</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DataTableToolbar
          table={table}
          searchPlaceholder="Search expenses..."
          filters={[
            {
              columnId: 'status',
              title: 'Status',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'declined', label: 'Declined' },
                { value: 'in-transit', label: 'In Transit' },
                { value: 'delivered', label: 'Delivered' },
              ],
            },
          ]}
        />
        <Button onClick={() => navigate({ to: `/projects/${projectId}/expenses/new` })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <ExpensesBulkActions
        table={table}
        onBulkApprove={(rows) => rows.forEach((e) => approveMutation.mutate(e._id))}
        onBulkReject={(rows) => rows.forEach((e) => rejectMutation.mutate(e._id))}
        onBulkDelete={(rows) => rows.forEach((e) => deleteMutation.mutate(e._id))}
      />

      {/* Confirm dialog for single actions */}
      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? 'Delete Expense'
            : dialog.action === 'approve'
            ? 'Approve Expense'
            : 'Reject Expense'
        }
        desc={`Are you sure you want to ${dialog.action} this expense?`}
        destructive={dialog.action === 'delete' || dialog.action === 'reject'}
        handleConfirm={handleConfirm}
        confirmText={
          dialog.action === 'delete'
            ? 'Delete'
            : dialog.action === 'approve'
            ? 'Approve'
            : 'Reject'
        }
      />
    </div>
  )
}
