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
  type FilterFn,
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, Clock, RefreshCw, X } from 'lucide-react'
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
import { DataTableActionMenu } from '@/features/purchase-orders/components/data-table-action-menu'

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

/* ------------------ Custom date-between filter ------------------ */
const dateBetweenFilter: FilterFn<PurchaseOrder> = (row, columnId, filterValue) => {
  if (!filterValue) return true
  const [start, end] = filterValue as [string | null | undefined, string | null | undefined]
  const cell = row.getValue<string>(columnId)
  if (!cell) return true
  const rowDate = new Date(cell)
  if (Number.isNaN(rowDate.getTime())) return true
  if (start) {
    const s = new Date(start)
    if (!Number.isNaN(s.getTime()) && rowDate < s) return false
  }
  if (end) {
    const e = new Date(end)
    if (!Number.isNaN(e.getTime())) {
      e.setHours(23, 59, 59, 999)
      if (rowDate > e) return false
    }
  }
  return true
}

/* ------------------ Date Range Popover ------------------ */
function DateRangePopover({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  table,
}: {
  startDate: string
  endDate: string
  setStartDate: (val: string) => void
  setEndDate: (val: string) => void
  table: ReturnType<typeof useReactTable<PurchaseOrder>>
}) {
  const [open, setOpen] = React.useState(false)

  const formatLabel = () => {
    if (!startDate && !endDate) return 'Date range'
    if (startDate && endDate)
      return `${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()}`
    if (startDate) return `From ${new Date(startDate).toLocaleDateString()}`
    if (endDate) return `Until ${new Date(endDate).toLocaleDateString()}`
    return ''
  }

  const applyPreset = (preset: 'today' | '7days' | '30days') => {
    const now = new Date()
    if (preset === 'today') {
      const iso = now.toISOString().slice(0, 10)
      setStartDate(iso)
      setEndDate(iso)
    } else if (preset === '7days') {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(now.toISOString().slice(0, 10))
    } else if (preset === '30days') {
      const start = new Date(now)
      start.setDate(now.getDate() - 29)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(now.toISOString().slice(0, 10))
    }
    setOpen(false)
  }

  const clearSelection = () => {
    setStartDate('')
    setEndDate('')
    table.resetColumnFilters()
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        {formatLabel()}
        <Clock className="w-4 h-4 opacity-60" />
      </Button>

      {open && (
        <div className="absolute z-30 mt-2 right-0 w-[320px] bg-white border rounded-md shadow-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-slate-600">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => applyPreset('today')}>
              Today
            </Button>
            <Button size="sm" onClick={() => applyPreset('7days')}>
              Last 7 days
            </Button>
            <Button size="sm" onClick={() => applyPreset('30days')}>
              Last 30 days
            </Button>
          </div>

          <div className="flex justify-between">
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------ Columns ------------------ */
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
}): ColumnDef<PurchaseOrder, any>[] {
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
        const colors = {
          approved: 'bg-green-100 text-green-700',
          declined: 'bg-red-100 text-red-700',
          pending: 'bg-yellow-100 text-yellow-700',
          'in-transit': 'bg-blue-100 text-blue-700',
          delivered: 'bg-purple-100 text-purple-700',
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      filterFn: 'dateBetween',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) =>
        new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES',
        }).format(getValue() as number),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DataTableActionMenu
          po={row.original}
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

/* ------------------ Bulk Actions ------------------ */
function PurchaseOrdersBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
  isMutating,
}: {
  table: ReturnType<typeof useReactTable<PurchaseOrder>>
  onBulkApprove?: (rows: PurchaseOrder[]) => void
  onBulkReject?: (rows: PurchaseOrder[]) => void
  onBulkDelete?: (rows: PurchaseOrder[]) => void
  isMutating?: boolean
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

  if (!selected.length) return null

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" variant="outline" disabled={isMutating} onClick={() => setDialog({ open: true, action: 'approve' })}>Approve</Button>
      <Button size="sm" variant="outline" disabled={isMutating} onClick={() => setDialog({ open: true, action: 'reject' })}>Reject</Button>
      <Button size="sm" variant="destructive" disabled={isMutating} onClick={() => setDialog({ open: true, action: 'delete' })}>Delete</Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete' ? 'Delete Purchase Orders' :
          dialog.action === 'approve' ? 'Approve Purchase Orders' :
          'Reject Purchase Orders'
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} order(s)?`}
        destructive={dialog.action === 'delete' || dialog.action === 'reject'}
        handleConfirm={handleConfirm}
        confirmText={dialog.action?.charAt(0).toUpperCase() + dialog.action?.slice(1)}
      />
    </div>
  )
}

/* ------------------ Main Component ------------------ */
export function PurchaseOrderTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const projectId = useProjectStore((s) => s.projectId)

  /* Data */
  const { data: purchaseOrders = [], isLoading, isError } = useQuery({
    queryKey: ['purchaseOrders', projectId],
    queryFn: async () =>
      (await axiosInstance.get(`/api/purchase-orders/project/${projectId}`)).data.data,
    enabled: !!projectId,
  })

  /* Mutations */
  const approveMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/purchase-orders/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] }),
  })
  const rejectMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/purchase-orders/${id}/unapprove`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/purchase-orders/${id}/hard`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] }),
  })

  const handleBulk = async (
    rows: PurchaseOrder[],
    action: 'approve' | 'reject' | 'delete'
  ) => {
    await Promise.all(
      rows.map((r) => {
        if (action === 'approve') return approveMutation.mutateAsync(r._id)
        if (action === 'reject') return rejectMutation.mutateAsync(r._id)
        if (action === 'delete') return deleteMutation.mutateAsync(r._id)
      })
    )
  }

  /* Table */
  const table = useReactTable({
    data: purchaseOrders,
    columns: getColumns({
      onView: (po) => navigate({ to: `/projects/${projectId}/purchaseOrders/${po._id}` }),
      onEdit: (po) => navigate({ to: `/projects/${projectId}/purchaseOrders/${po._id}/edit` }),
      onApprove: (po) => approveMutation.mutate(po._id),
      onReject: (po) => rejectMutation.mutate(po._id),
      onDelete: (po) => deleteMutation.mutate(po._id),
    }),
    state: { rowSelection, sorting, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    filterFns: { dateBetween: dateBetweenFilter },
  })

  // Sync date column filter
  React.useEffect(() => {
    const col = table.getColumn('date')
    if (!col) return
    if (!startDate && !endDate) col.setFilterValue(undefined)
    else col.setFilterValue([startDate || null, endDate || null])
  }, [startDate, endDate, table])

  if (!projectId) return <div>Project ID missing.</div>
  if (isLoading) return <div>Loading purchase orders…</div>
  if (isError) return <div>Failed to load purchase orders.</div>

  const clearAllFilters = () => {
    setStartDate('')
    setEndDate('')
    table.resetColumnFilters()
    table.setGlobalFilter('')
  }

  return (
    <div className="space-y-4 p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <DataTableToolbar
            table={table}
            searchPlaceholder="Search purchase orders…"
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
          <DateRangePopover
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            table={table}
          />
          <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reset
          </Button>
        </div>

        <Button onClick={() => navigate({ to: `/projects/${projectId}/purchaseOrders/new` })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase Order
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-full text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} colSpan={h.colSpan}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, [role="menuitem"], input, a')) return
                    navigate({ to: `/projects/${projectId}/purchaseOrders/${row.original._id}` })
                  }}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
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
        isMutating={approveMutation.isLoading || rejectMutation.isLoading || deleteMutation.isLoading}
      />
    </div>
  )
}
