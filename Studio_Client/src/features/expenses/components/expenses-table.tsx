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
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useProjectStore } from '@/stores/projectStore'
import { Plus } from 'lucide-react'
import { DataTableActionMenu } from './data-table-action-menu'

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

/* ---------------- Bulk Actions Component ---------------- */
function ExpensesBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: ReturnType<typeof useReactTable<Expense>>
  onBulkApprove?: (rows: Expense[]) => void
  onBulkReject?: (rows: Expense[]) => void
  onBulkDelete?: (rows: Expense[]) => void
}) {
  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const [dialog, setDialog] = React.useState<{ open: boolean; action?: 'approve' | 'reject' | 'delete' }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.action) return
    if (dialog.action === 'approve') onBulkApprove?.(selected)
    if (dialog.action === 'reject') onBulkReject?.(selected)
    if (dialog.action === 'delete') onBulkDelete?.(selected)
    setDialog({ open: false })
  }

  if (selected.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'approve' })}>Approve</Button>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'reject' })}>Reject</Button>
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
        confirmText={dialog.action?.charAt(0).toUpperCase() + dialog.action?.slice(1)}
      />
    </div>
  )
}

/* ---------------- Columns Configuration ---------------- */
function getColumns({
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  isMutating,
}: {
  onView?: (e: Expense) => void
  onEdit?: (e: Expense) => void
  onApprove?: (e: Expense, close: () => void) => void
  onReject?: (e: Expense, close: () => void) => void
  onDelete?: (e: Expense, close: () => void) => void
  isMutating?: boolean
}): ColumnDef<Expense>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'expenseNumber',
      header: 'Expense #',
      cell: ({ getValue, row }) => (
        <Button variant="link" className="p-0" onClick={() => onView?.(row.original)}>
          {getValue() as string}
        </Button>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ getValue, row }) => (
        <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      cell: ({ getValue, row }) => (
        <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue, row }) => {
        const status = getValue() as Expense['status']
        return (
          <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        )
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue, row }) => (
        <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
          {new Date(getValue() as string).toLocaleDateString('en-KE')}
        </div>
      ),
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery',
      cell: ({ getValue, row }) => (
        <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
          {new Date(getValue() as string).toLocaleDateString('en-KE')}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue, row }) => (
        <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
          {`KES ${(getValue() as number).toLocaleString()}`}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DataTableActionMenu<Expense>
          row={row.original}
          entityName="expense"
          isMutating={isMutating}
          onView={onView}
          onEdit={onEdit}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
        />
      ),
    },
  ]
}

/* ---------------- Main Component ---------------- */
export function ExpensesTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectId = useProjectStore((state) => state.projectId)

  const { data: expenses = [], isLoading, isError } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/expenses/project/${projectId}`)
      return res.data ?? []
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/expenses/${id}/approve`),
    onSuccess: () => {
      toast.success('Expense approved successfully')
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] })
    },
    onError: () => toast.error('Failed to approve expense'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/expenses/${id}/reject`),
    onSuccess: () => {
      toast.success('Expense rejected successfully')
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] })
    },
    onError: () => toast.error('Failed to reject expense'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] })
    },
    onError: () => toast.error('Failed to delete expense'),
  })

  const table = useReactTable({
    data: expenses,
    columns: getColumns({
      onView: (e) => navigate({ to: `/projects/${projectId}/expenses/${e._id}` }),
      onEdit: (e) => navigate({ to: `/projects/${projectId}/expenses/${e._id}/edit` }),
      onApprove: (e, close) => {
        approveMutation.mutate(e._id)
        close()
      },
      onReject: (e, close) => {
        rejectMutation.mutate(e._id)
        close()
      },
      onDelete: (e, close) => {
        deleteMutation.mutate(e._id)
        close()
      },
      isMutating:
        approveMutation.isPending ||
        rejectMutation.isPending ||
        deleteMutation.isPending,
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

  const handleBulk = (rows: Expense[], action: 'approve' | 'reject' | 'delete') => {
    rows.forEach((r) => {
      if (action === 'approve') approveMutation.mutate(r._id)
      if (action === 'reject') rejectMutation.mutate(r._id)
      if (action === 'delete') deleteMutation.mutate(r._id)
    })
  }

  if (!projectId) return <div>Project ID is missing.</div>
  if (isLoading) return <div>Loading expenses…</div>
  if (isError) return <div>Failed to load expenses.</div>

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DataTableToolbar
          table={table}
          searchPlaceholder="Search expenses…"
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

      {/* Table */}
      <div className="overflow-x-auto rounded-md border bg-background shadow-sm">
        <Table className="min-w-full text-sm [&_tr:nth-child(even)]:bg-muted/30">
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    navigate({ to: `/projects/${projectId}/expenses/${row.original._id}` })
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === 'actions') e.stopPropagation()
                      }}
                    >
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

      {/* Bulk Actions */}
      <ExpensesBulkActions
        table={table}
        onBulkApprove={(rows) => handleBulk(rows, 'approve')}
        onBulkReject={(rows) => handleBulk(rows, 'reject')}
        onBulkDelete={(rows) => handleBulk(rows, 'delete')}
      />
    </div>
  )
}
