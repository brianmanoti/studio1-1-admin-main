'use client'

import * as React from 'react'
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type FilterFn,
} from '@tanstack/react-table'
import { Plus, Calendar, Clock, RotateCcw } from 'lucide-react'
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
import { DataTableToolbar, DataTablePagination } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { useNavigate } from '@tanstack/react-router'
import { useProjectStore } from '@/stores/projectStore'
import { toast } from 'sonner'
import { DataTableActionMenu } from './data-table-action-menu'

export type Wage = {
  _id: string
  wageNumber: string
  company: string
  vendorName: string
  status: 'pending' | 'in-transit' | 'delivered' | 'declined' | 'approved'
  date: string
  deliveryDate: string
  amount: number
}

// Format date
function formatKenyaDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Format amount
function formatKES(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount ?? 0)
}

/* ------------------ Date Between Filter ------------------ */
const dateBetweenFilter: FilterFn<Wage> = (row, columnId, filterValue) => {
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
  table: ReturnType<typeof useReactTable<Wage>>
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
    let start: string, end: string
    if (preset === 'today') {
      start = end = now.toISOString().slice(0, 10)
    } else if (preset === '7days') {
      const s = new Date(now)
      s.setDate(now.getDate() - 6)
      start = s.toISOString().slice(0, 10)
      end = now.toISOString().slice(0, 10)
    } else {
      const s = new Date(now)
      s.setDate(now.getDate() - 29)
      start = s.toISOString().slice(0, 10)
      end = now.toISOString().slice(0, 10)
    }
    setStartDate(start)
    setEndDate(end)
    table.getColumn('date')?.setFilterValue([start, end])
    setOpen(false)
  }

  const clearSelection = () => {
    setStartDate('')
    setEndDate('')
    table.getColumn('date')?.setFilterValue(undefined)
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
        <div className="absolute z-30 mt-2 right-0 w-full max-w-sm bg-white border rounded-md shadow-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col w-full">
              <label className="text-xs text-slate-600">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  table.getColumn('date')?.setFilterValue([e.target.value || undefined, endDate || undefined])
                }}
                className="border rounded px-2 py-1 text-sm w-full"
              />
            </div>
            <div className="flex flex-col w-full">
              <label className="text-xs text-slate-600">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  table.getColumn('date')?.setFilterValue([startDate || undefined, e.target.value || undefined])
                }}
                className="border rounded px-2 py-1 text-sm w-full"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => applyPreset('today')}>Today</Button>
            <Button size="sm" onClick={() => applyPreset('7days')}>Last 7 days</Button>
            <Button size="sm" onClick={() => applyPreset('30days')}>Last 30 days</Button>
          </div>

          <div className="flex justify-between">
            <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------ Bulk Actions ------------------ */
function WagesBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: ReturnType<typeof useReactTable<Wage>>
  onBulkApprove?: (rows: Wage[]) => void
  onBulkReject?: (rows: Wage[]) => void
  onBulkDelete?: (rows: Wage[]) => void
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

  if (!selected.length) return null

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'approve' })}>Approve</Button>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'reject' })}>Reject</Button>
      <Button size="sm" variant="destructive" onClick={() => setDialog({ open: true, action: 'delete' })}>Delete</Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={dialog.action === 'delete' ? 'Delete Wages' : dialog.action === 'approve' ? 'Approve Wages' : 'Reject Wages'}
        desc={`Are you sure you want to ${dialog.action} ${selected.length} wage(s)?`}
        destructive={dialog.action === 'delete' || dialog.action === 'reject'}
        handleConfirm={handleConfirm}
        confirmText={dialog.action?.charAt(0).toUpperCase() + dialog.action?.slice(1)}
      />
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
  isMutating,
}: {
  onView?: (w: Wage) => void
  onEdit?: (w: Wage) => void
  onApprove?: (w: Wage, close: () => void) => void
  onReject?: (w: Wage, close: () => void) => void
  onDelete?: (w: Wage, close: () => void) => void
  isMutating?: boolean
}): ColumnDef<Wage>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} indeterminate={row.getIsSomeSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'wageNumber',
      header: 'Wage #',
      cell: ({ getValue, row }) => <Button variant="link" className="p-0" onClick={() => onView?.(row.original)}>{getValue() as string}</Button>,
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ getValue, row }) => <div className="cursor-pointer" onClick={() => onView?.(row.original)}>{getValue() as string}</div>,
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      cell: ({ getValue, row }) => <div className="cursor-pointer" onClick={() => onView?.(row.original)}>{getValue() as string}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue, row }) => <div className="cursor-pointer" onClick={() => onView?.(row.original)}>{(getValue() as string).charAt(0).toUpperCase() + (getValue() as string).slice(1)}</div>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue, row }) => <div className="cursor-pointer" onClick={() => onView?.(row.original)}>{formatKenyaDate(getValue() as string)}</div>,
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery',
      cell: ({ getValue, row }) => <div className="cursor-pointer" onClick={() => onView?.(row.original)}>{formatKenyaDate(getValue() as string)}</div>,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue, row }) => <div className="cursor-pointer" onClick={() => onView?.(row.original)}>{formatKES(getValue() as number)}</div>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <DataTableActionMenu<Wage> row={row.original} entityName="wage" isMutating={isMutating} onView={onView} onEdit={onEdit} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />,
    },
  ]
}

/* ------------------ Main Component ------------------ */
export function WagesTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectId = useProjectStore((state) => state.projectId)

  const { data: wages = [], isLoading, isError } = useQuery({
    queryKey: ['wages', projectId],
    queryFn: async () => (await axiosInstance.get(`/api/wages/project/${projectId}`)).data ?? [],
    enabled: !!projectId,
  })

  const approveMutation = useMutation({ mutationFn: (id: string) => axiosInstance.patch(`/api/wages/${id}/approve`), onSuccess: () => { toast.success('Wage approved'); queryClient.invalidateQueries({ queryKey: ['wages', projectId] }) } })
  const rejectMutation = useMutation({ mutationFn: (id: string) => axiosInstance.patch(`/api/wages/${id}/reject`), onSuccess: () => { toast.success('Wage rejected'); queryClient.invalidateQueries({ queryKey: ['wages', projectId] }) } })
  const deleteMutation = useMutation({ mutationFn: (id: string) => axiosInstance.delete(`/api/wages/${id}`), onSuccess: () => { toast.success('Wage deleted'); queryClient.invalidateQueries({ queryKey: ['wages', projectId] }) } })

  const table = useReactTable({
    data: wages,
    columns: getColumns({ isMutating: approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending }),
    state: { sorting, columnVisibility, rowSelection },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    columnFilters: [],
    filterFns: { dateBetween: dateBetweenFilter },
  })

  React.useEffect(() => {
    table.getColumn('date')?.setFilterValue([startDate || undefined, endDate || undefined])
  }, [startDate, endDate])

  // Reset all filters including date range
  const handleResetAllFilters = () => {
    // Reset date range
    setStartDate('')
    setEndDate('')
    table.getColumn('date')?.setFilterValue(undefined)
    
    // Reset search and other filters
    table.setGlobalFilter('')
    table.resetColumnFilters()
    
    // Reset sorting
    setSorting([])
    
    // Reset row selection
    setRowSelection({})
  }

  const handleBulk = (rows: Wage[], action: 'approve' | 'reject' | 'delete') => {
    rows.forEach((r) => {
      if (action === 'approve') approveMutation.mutate(r._id)
      if (action === 'reject') rejectMutation.mutate(r._id)
      if (action === 'delete') deleteMutation.mutate(r._id)
    })
  }

  if (!projectId) return <div>Project ID is missing.</div>
  if (isLoading) return <div>Loading wages…</div>
  if (isError) return <div>Failed to load wages.</div>

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DataTableToolbar
            table={table}
            searchPlaceholder="Search wages…"
            filters={[{
              columnId: 'status',
              title: 'Status',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'declined', label: 'Declined' },
                { value: 'in-transit', label: 'In Transit' },
                { value: 'delivered', label: 'Delivered' },
              ]
            }]}
            showResetButton={false} // This disables the reset button in DataTableToolbar
          />
          <DateRangePopover
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            table={table}
          />
          <Button 
            variant="outline" 
            onClick={handleResetAllFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
        <Button onClick={() => navigate({ to: `/projects/${projectId}/wages/new` })}>
          <Plus className="w-4 h-4 mr-2" />Add Wage
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
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate({ to: `/projects/${projectId}/wages/${row.original._id}` })}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} onClick={(e) => { if (cell.column.id === 'actions') e.stopPropagation() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Bulk actions */}
      <WagesBulkActions
        table={table}
        onBulkApprove={(rows) => handleBulk(rows, 'approve')}
        onBulkReject={(rows) => handleBulk(rows, 'reject')}
        onBulkDelete={(rows) => handleBulk(rows, 'delete')}
      />
    </div>
  )
}