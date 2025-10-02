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

/** Dummy data */
const dummyExpenses: Expense[] = [
  {
    _id: '1',
    expenseNumber: 'EX-001',
    company: 'Delta Ltd',
    vendorName: 'Vendor X',
    status: 'pending',
    date: new Date().toISOString(),
    deliveryDate: new Date().toISOString(),
    amount: 500,
  },
  {
    _id: '2',
    expenseNumber: 'EX-002',
    company: 'Omega Corp',
    vendorName: 'Vendor Y',
    status: 'approved',
    date: new Date().toISOString(),
    deliveryDate: new Date().toISOString(),
    amount: 1200,
  },
  {
    _id: '3',
    expenseNumber: 'EX-003',
    company: 'Sigma Inc',
    vendorName: 'Vendor Z',
    status: 'declined',
    date: new Date().toISOString(),
    deliveryDate: new Date().toISOString(),
    amount: 750,
  },
]

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
      <span className="text-sm text-gray-600">
        {selected.length} selected
      </span>
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
  onDelete,
  onApprove,
  onReject,
}: {
  onView?: (e: Expense) => void
  onEdit?: (e: Expense) => void
  onDelete?: (e: Expense) => void
  onApprove?: (e: Expense) => void
  onReject?: (e: Expense) => void
}): ColumnDef<Expense>[] {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    expense?: Expense
    action?: 'approve' | 'reject' | 'delete'
  }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.expense || !dialog.action) return
    if (dialog.action === 'approve') onApprove?.(dialog.expense)
    if (dialog.action === 'reject') onReject?.(dialog.expense)
    if (dialog.action === 'delete') onDelete?.(dialog.expense)
    setDialog({ open: false })
  }

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
        const exp = row.original
        return (
          <div className="flex gap-2">
            <button onClick={() => onView?.(exp)} title="View">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit?.(exp)} title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setDialog({ open: true, expense: exp, action: 'approve' })}>
              <Check className="w-4 h-4 text-green-600" />
            </button>
            <button onClick={() => setDialog({ open: true, expense: exp, action: 'reject' })}>
              <X className="w-4 h-4 text-red-600" />
            </button>
            <button onClick={() => setDialog({ open: true, expense: exp, action: 'delete' })}>
              <Trash className="w-4 h-4 text-red-700" />
            </button>

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
              desc={
                dialog.expense
                  ? `Are you sure you want to ${dialog.action} ${dialog.expense.expenseNumber}?`
                  : ''
              }
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

/** Main ExpensesTable component */
export function ExpensesTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data: dummyExpenses,
    columns: getColumns({
      onView: (e) => alert(`Viewing ${e.expenseNumber}`),
      onEdit: (e) => alert(`Editing ${e.expenseNumber}`),
      onApprove: (e) => alert(`Approved ${e.expenseNumber}`),
      onReject: (e) => alert(`Rejected ${e.expenseNumber}`),
      onDelete: (e) => alert(`Deleted ${e.expenseNumber}`),
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
        <Button onClick={() => alert('Add new expense')}>
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
        onBulkApprove={(rows) => alert(`Bulk approved ${rows.length} expenses`)}
        onBulkReject={(rows) => alert(`Bulk rejected ${rows.length} expenses`)}
        onBulkDelete={(rows) => alert(`Bulk deleted ${rows.length} expenses`)}
      />
    </div>
  )
}
