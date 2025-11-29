
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
import { Plus, Calendar, RefreshCw, X, Frown, Clock } from 'lucide-react'
import { DataTableActionMenu } from './data-table-action-menu'

/** Expense type */
export type Expense = {
  _id: string
  expenseNumber: string
  company: string
  vendorName: string
  status: 'pending' | 'declined' | 'approved'
  date: string
  deliveryDate: string
  amount: number
}

/* ---------------- Custom date-between filter ---------------- */
const dateBetweenFilter: FilterFn<Expense> = (row, columnId, filterValue) => {
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
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 items-center">
      <span className="text-sm text-gray-700">{selected.length} selected</span>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'approve' })}>Approve</Button>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'reject' })}>Reject</Button>
      <Button size="sm" variant="destructive" onClick={() => setDialog({ open: true, action: 'delete' })}>Delete</Button>

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
        const status = getValue() as Wage['status']
        
        // Map status to colors
        const statusColors: Record<Wage['status'], string> = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          declined: 'bg-red-100 text-red-800',
        }

        return (
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]} cursor-pointer`}
            onClick={() => onView?.(row.original)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      filterFn: 'dateBetween',
      cell: ({ getValue, row }) => (
        <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
          {(() => {
            const val = getValue() as string
            const d = new Date(val)
            return Number.isNaN(d.getTime()) ? val || '—' : d.toLocaleDateString('en-KE')
          })()}
        </div>
      ),
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery',
      cell: ({ getValue, row }) => (
        <div className="cursor-pointer" onClick={() => onView?.(row.original)}>
          {(() => {
            const val = getValue() as string
            const d = new Date(val)
            return Number.isNaN(d.getTime()) ? val || '—' : d.toLocaleDateString('en-KE')
          })()}
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

/* ---------------- Helper: format range label ---------------- */
function formatRangeLabel(start?: string | null, end?: string | null) {
  if (!start && !end) return ''
  if (start && end) {
    const s = new Date(start).toLocaleDateString('en-KE')
    const e = new Date(end).toLocaleDateString('en-KE')
    return `${s} → ${e}`
  }
  if (start && !end) return `From ${new Date(start).toLocaleDateString('en-KE')}`
  if (!start && end) return `Until ${new Date(end).toLocaleDateString('en-KE')}`
  return ''
}

/* ---------------- Main Component ---------------- */
export function SubExpensesTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectId = useProjectStore((state) => state.projectId)

  // Date filter states
  const [startDate, setStartDate] = React.useState<string>('')
  const [endDate, setEndDate] = React.useState<string>('')

  // Popover open state for date picker
  const [dateOpen, setDateOpen] = React.useState(false)

  const { data: expenses = [], isLoading, isError } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/expenses/project/${projectId}/expense-subcontractors`)
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
    filterFns: {
      dateBetween: dateBetweenFilter,
    },
  })

  // sync table date column with startDate/endDate
  React.useEffect(() => {
    const col = table.getColumn('date')
    if (!col) return
    if (!startDate && !endDate) col.setFilterValue(undefined)
    else col.setFilterValue([startDate || null, endDate || null])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, table])

  const handleBulk = (rows: Expense[], action: 'approve' | 'reject' | 'delete') => {
    rows.forEach((r) => {
      if (action === 'approve') approveMutation.mutate(r._id)
      if (action === 'reject') rejectMutation.mutate(r._id)
      if (action === 'delete') deleteMutation.mutate(r._id)
    })
  }

  const clearAllFilters = () => {
    setStartDate('')
    setEndDate('')
    setDateOpen(false)
    table.setGlobalFilter('')
    table.resetColumnFilters()
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
    setDateOpen(false)
  }

  if (!projectId) return <div>Project ID is missing.</div>

  // Loading skeleton (professional)
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-muted/50 rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="rounded-md border overflow-hidden">
          {/* header skeleton */}
          <div className="p-4">
            <div className="h-6 w-40 bg-muted/50 rounded animate-pulse mb-3"></div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4">
        <div className="text-red-600">Failed to load expenses.</div>
      </div>
    )
  }

  const activeFilterPills: { id: string; label: string; onRemove: () => void }[] = []

  // status filter pill if present (assuming toolbar sets column filter 'status')
  const statusCol = table.getColumn('status')
  const statusFilter = statusCol?.getFilterValue()
  if (statusFilter) {
    activeFilterPills.push({
      id: 'status',
      label: `Status: ${String(statusFilter)}`,
      onRemove: () => statusCol?.setFilterValue(undefined),
    })
  }

  // global search pill
  const global = (table.getState().globalFilter ?? '') as string
  if (global) {
    activeFilterPills.push({
      id: 'search',
      label: `Search: "${global}"`,
      onRemove: () => table.setGlobalFilter(''),
    })
  }

  // date pill
  if (startDate || endDate) {
    const label = formatRangeLabel(startDate || null, endDate || null)
    activeFilterPills.push({
      id: 'date',
      label: `Date: ${label}`,
      onRemove: () => {
        setStartDate('')
        setEndDate('')
      },
    })
  }

  return (
    <div className="space-y-4 ">
      {/* Top toolbar area */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
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
                ],
              },
            ]}
          />

          {/* Date range popover (simple, polished) */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setDateOpen((v) => !v)}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {startDate || endDate ? formatRangeLabel(startDate || null, endDate || null) : 'Date range'}
              </span>
              <Clock className="w-4 h-4 opacity-60" />
            </Button>

            {dateOpen && (
              <div className="absolute z-30 mt-2 right-0 w-[320px] bg-white border rounded-md shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Select date range</div>
                  <button
                    className="p-1 rounded hover:bg-muted/20"
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                    }}
                    aria-label="Clear selection"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
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

                <div className="flex items-center gap-2 mb-3">
                  <Button size="sm" onClick={() => applyPreset('today')}>Today</Button>
                  <Button size="sm" onClick={() => applyPreset('7days')}>Last 7 days</Button>
                  <Button size="sm" onClick={() => applyPreset('30days')}>Last 30 days</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate('') }}>
                    Clear
                  </Button>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDateOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </div>

          {/* Reset / Clear all filters */}
          <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => navigate({ to: `new` })}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilterPills.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-600">Active filters:</span>
          {activeFilterPills.map((p) => (
            <div key={p.id} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-sm">
              <span>{p.label}</span>
              <button className="p-1 rounded hover:bg-muted/20" onClick={p.onRemove} aria-label={`Remove ${p.id}`}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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
                        if (cell.column.id === 'select') e.stopPropagation()
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Frown className="w-8 h-8 text-slate-400" />
                    <div className="text-sm text-slate-600">No expenses found.</div>
                    <div className="text-xs text-slate-400">Try adjusting filters or add a new expense.</div>
                    <div className="mt-3">
                      <Button onClick={clearAllFilters} variant="outline" className="mr-2">
                        Reset filters
                      </Button>
                      <Button onClick={() => navigate({ to: `new` })}>
                        Add Expense
                      </Button>
                    </div>
                  </div>
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
