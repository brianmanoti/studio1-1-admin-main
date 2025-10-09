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
import { useQuery } from '@tanstack/react-query'
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
import { useProjectStore } from '@/stores/projectStore'

/** Purchase Order type */
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

/** Bulk actions bar */
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

/** Columns with row actions */
function getColumns({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: {
  onView?: (po: PurchaseOrder) => void
  onEdit?: (po: PurchaseOrder) => void
  onDelete?: (po: PurchaseOrder) => void
  onApprove?: (po: PurchaseOrder) => void
  onReject?: (po: PurchaseOrder) => void
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
    { accessorKey: 'poNumber', header: 'PO #' },
    { accessorKey: 'company', header: 'Company' },
    { accessorKey: 'vendorName', header: 'Vendor' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'deliveryDate', header: 'Delivery' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const po = row.original
        return (
          <div className="flex gap-2">
            <button onClick={() => onView?.(po)} title="View">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit?.(po)} title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onApprove?.(po)}>
              <Check className="w-4 h-4 text-green-600" />
            </button>
            <button onClick={() => onReject?.(po)}>
              <X className="w-4 h-4 text-red-600" />
            </button>
            <button onClick={() => onDelete?.(po)}>
              <Trash className="w-4 h-4 text-red-700" />
            </button>
          </div>
        )
      },
    },
  ]
}

/** Main PurchaseOrdersTable */
export function SubPurchaseOrderTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const projectId = useProjectStore((state) => state.projectId)

  const navigate = useNavigate()

  // ------------------- Fetch Purchase Orders -------------------
  const { data: purchaseOrders = [], isLoading, isError } = useQuery({
    queryKey: ['purchaseOrders', projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/purchase-orders/projects/${projectId}`)
      return res.data.data
    },
    staleTime: 1000 * 60 * 5,
  })

  const table = useReactTable({
    data: purchaseOrders, // ✅ use API data
    columns: getColumns({
      onView: (po) => alert(`Viewing ${po.poNumber}`),
      onEdit: (po) => alert(`Editing ${po.poNumber}`),
      onApprove: (po) => alert(`Approved ${po.poNumber}`),
      onReject: (po) => alert(`Rejected ${po.poNumber}`),
      onDelete: (po) => alert(`Deleted ${po.poNumber}`),
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
        <Button onClick={() => navigate({ to: `/projects/${projectId}/subcontractors/purchase-orders/new` })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase Order
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

      <PurchaseOrdersBulkActions
        table={table}
        onBulkApprove={(rows) => alert(`Bulk approved ${rows.length} purchase orders`)}
        onBulkReject={(rows) => alert(`Bulk rejected ${rows.length} purchase orders`)}
        onBulkDelete={(rows) => alert(`Bulk deleted ${rows.length} purchase orders`)}
      />
    </div>
  )
}
