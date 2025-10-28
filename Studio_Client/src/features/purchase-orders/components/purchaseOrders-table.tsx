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
import { useProjectStore } from '@/stores/projectStore'

export type PurchaseOrder = {
  _id: string
  poNumber: string
  company: string
  vendorName: string
  status: 'pending' | 'in-transit' | 'delivered' | 'declined' | 'approved'
  date: string
  deliveryDate: string
  amount: number
}

/** Bulk Actions */
function PurchaseOrdersBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: TanTable<PurchaseOrder>
  onBulkApprove?: (rows: PurchaseOrder[]) => void
  onBulkReject?: (rows: PurchaseOrder[]) => void
  onBulkDelete?: (rows: PurchaseOrder[]) => void
}) {
  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const [dialog, setDialog] = React.useState<{ open: boolean; action?: 'approve' | 'reject' | 'delete' }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.action) return
    if (dialog.action === 'approve') onBulkApprove?.(selected)
    if (dialog.action === 'reject') onBulkReject?.(selected)
    if (dialog.action === 'delete') onBulkDelete?.(selected)
  }

  if (selected.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'approve' })}>
        Approve
      </Button>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'reject' })}>
        Reject
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setDialog({ open: true, action: 'delete' })}>
        Delete
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? 'Delete Purchase Orders'
            : dialog.action === 'approve'
            ? 'Approve Purchase Orders'
            : 'Reject Purchase Orders'
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} order(s)?`}
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

/** Status Badge Colors */
function getStatusColor(status: PurchaseOrder['status']) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700'
    case 'declined':
      return 'bg-red-100 text-red-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'in-transit':
      return 'bg-blue-100 text-blue-700'
    case 'delivered':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/** Columns */
function getColumns({
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: {
  onView?: (po: PurchaseOrder) => void
  onEdit?: (po: PurchaseOrder) => void
  onApprove?: (po: PurchaseOrder, closeDialog: () => void) => void
  onReject?: (po: PurchaseOrder, closeDialog: () => void) => void
  onDelete?: (po: PurchaseOrder, closeDialog: () => void) => void
}): ColumnDef<PurchaseOrder>[] {
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
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
    },
    { accessorKey: 'poNumber', header: 'PO #' },
    { accessorKey: 'company', header: 'Company' },
    { accessorKey: 'vendorName', header: 'Vendor' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as PurchaseOrder['status']
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-KE'),
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-KE'),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => {
        const amount = getValue() as number
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount)
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const po = row.original
        const [dialog, setDialog] = React.useState<{ open: boolean; action?: 'approve' | 'reject' | 'delete' }>({ open: false })

        const handleConfirm = () => {
          if (!dialog.action) return
          if (dialog.action === 'approve') onApprove?.(po, () => setDialog({ open: false }))
          if (dialog.action === 'reject') onReject?.(po, () => setDialog({ open: false }))
          if (dialog.action === 'delete') onDelete?.(po, () => setDialog({ open: false }))
        }

        return (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onView?.(po)} title="View">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit?.(po)} title="Edit">
              <Pencil className="w-4 h-4" />
            </button>

            {po.status !== 'approved' && po.status !== 'declined' && (
              <>
                <button onClick={() => setDialog({ open: true, action: 'approve' })} title="Approve">
                  <Check className="w-4 h-4 text-green-600" />
                </button>
                <button onClick={() => setDialog({ open: true, action: 'reject' })} title="Reject">
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </>
            )}

            <button onClick={() => setDialog({ open: true, action: 'delete' })} title="Delete">
              <Trash className="w-4 h-4 text-red-700" />
            </button>

            <ConfirmDialog
              open={dialog.open}
              onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
              title={
                dialog.action === 'delete'
                  ? 'Delete Purchase Order'
                  : dialog.action === 'approve'
                  ? 'Approve Purchase Order'
                  : 'Reject Purchase Order'
              }
              desc={`Are you sure you want to ${dialog.action} this purchase order?`}
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
      },
    },
  ]
}

/** Main Table Component */
export function PurchaseOrderTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const projectId = useProjectStore((state) => state.projectId)

  /** ✅ Fetch purchase orders */
  const { data: purchaseOrders = [], isLoading, isError } = useQuery({
    queryKey: ['purchaseOrders', projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/purchase-orders/project/${projectId}`)
      return res.data.data
    },
    enabled: !!projectId,
  })

  /** ✅ Mutations */
  const approveMutation = useMutation({
    mutationFn: async (id: string) => axiosInstance.patch(`/api/purchase-orders/${id}/approve`),
    onSuccess: (_, id, context: any) => {
      toast.success('Purchase order approved.')
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] })
      context?.closeDialog?.()
    },
    onError: () => toast.error('Failed to approve purchase order.'),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => axiosInstance.patch(`/api/purchase-orders/${id}/decline`),
    onSuccess: (_, id, context: any) => {
      toast.success('Purchase order rejected.')
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] })
      context?.closeDialog?.()
    },
    onError: () => toast.error('Failed to reject purchase order.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axiosInstance.delete(`/api/purchase-orders/${id}`),
    onSuccess: (_, id, context: any) => {
      toast.success('Purchase order deleted.')
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] })
      context?.closeDialog?.()
    },
    onError: () => toast.error('Failed to delete purchase order.'),
  })

  const handleBulk = (rows: PurchaseOrder[], action: 'approve' | 'reject' | 'delete') => {
    rows.forEach((row) => {
      if (action === 'approve') approveMutation.mutate(row._id)
      if (action === 'reject') rejectMutation.mutate(row._id)
      if (action === 'delete') deleteMutation.mutate(row._id)
    })
  }

  /** ✅ Table */
  const table = useReactTable({
    data: purchaseOrders,
    columns: getColumns({
      onView: (po) => navigate({ to: `/projects/${projectId}/purchaseOrders/${po._id}` }),
      onEdit: (po) => navigate({ to: `/projects/${projectId}/purchaseOrders/${po._id}/edit` }),
      onApprove: (po, closeDialog) => approveMutation.mutate(po._id, { context: { closeDialog } }),
      onReject: (po, closeDialog) => rejectMutation.mutate(po._id, { context: { closeDialog } }),
      onDelete: (po, closeDialog) => deleteMutation.mutate(po._id, { context: { closeDialog } }),
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

  if (isLoading) return <div>Loading purchase orders...</div>
  if (isError) return <div>Failed to load purchase orders.</div>

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DataTableToolbar
          table={table}
          searchPlaceholder="Search purchase orders..."
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
        <Button onClick={() => navigate({ to: `/projects/${projectId}/purchaseOrders/new` })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase Order
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-full text-sm">
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

      <PurchaseOrdersBulkActions
        table={table}
        onBulkApprove={(rows) => handleBulk(rows, 'approve')}
        onBulkReject={(rows) => handleBulk(rows, 'reject')}
        onBulkDelete={(rows) => handleBulk(rows, 'delete')}
      />
    </div>
  )
}
