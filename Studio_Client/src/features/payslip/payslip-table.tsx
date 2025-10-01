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
import { Eye, Pencil, Trash, Check, X, Plus } from 'lucide-react'
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

/** Payslip type (essential only) */
export type Payslip = {
  _id: string
  employeeName: string
  date: string
  grossPay: number
  totalDeductions: number
  netPay: number
  status: 'draft' | 'approved' | 'declined'
  preparedBy: string
}

/** Dummy payslips */
const dummyPayslips: Payslip[] = [
  {
    _id: '1',
    employeeName: 'John Doe',
    date: '2025-09-15',
    grossPay: 5000,
    totalDeductions: 1200,
    netPay: 3800,
    status: 'draft',
    preparedBy: 'Admin User',
  },
  {
    _id: '2',
    employeeName: 'Jane Smith',
    date: '2025-09-20',
    grossPay: 6000,
    totalDeductions: 1500,
    netPay: 4500,
    status: 'approved',
    preparedBy: 'HR Manager',
  },
]

/** Bulk actions component */
function PayslipBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: TanTable<Payslip>
  onBulkApprove?: (rows: Payslip[]) => void
  onBulkReject?: (rows: Payslip[]) => void
  onBulkDelete?: (rows: Payslip[]) => void
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
    <div className="flex gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'approve' })}>Approve</Button>
      <Button size="sm" onClick={() => setDialog({ open: true, action: 'reject' })}>Reject</Button>
      <Button size="sm" variant="destructive" onClick={() => setDialog({ open: true, action: 'delete' })}>Delete</Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? 'Delete Payslips'
            : dialog.action === 'approve'
            ? 'Approve Payslips'
            : 'Reject Payslips'
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} payslip(s)?`}
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

/** Table columns */
function getColumns(): ColumnDef<Payslip>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
    { accessorKey: 'employeeName', header: 'Employee' },
    { accessorKey: 'date', header: 'Date' },
    {
      accessorKey: 'grossPay',
      header: 'Gross Pay',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      accessorKey: 'totalDeductions',
      header: 'Deductions',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      accessorKey: 'netPay',
      header: 'Net Pay',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'preparedBy', header: 'Prepared By' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const slip = row.original
        return (
          <div className="flex gap-2">
            <button onClick={() => alert(`View ${slip.employeeName}`)}><Eye className="w-4 h-4" /></button>
            <button onClick={() => alert(`Edit ${slip.employeeName}`)}><Pencil className="w-4 h-4" /></button>
            <button onClick={() => alert(`Approve ${slip.employeeName}`)}><Check className="w-4 h-4 text-green-600" /></button>
            <button onClick={() => alert(`Reject ${slip.employeeName}`)}><X className="w-4 h-4 text-red-600" /></button>
            <button onClick={() => alert(`Delete ${slip.employeeName}`)}><Trash className="w-4 h-4 text-red-700" /></button>
          </div>
        )
      },
    },
  ]
}

/** Main Table Component */
export function PayslipTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data: dummyPayslips,
    columns: getColumns(),
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <DataTableToolbar table={table} searchPlaceholder="Search payslips..." />
        <Button><Plus className="w-4 h-4 mr-2" /> Add Payslip</Button>
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

      {/* Bulk Actions */}
      <PayslipBulkActions
        table={table}
        onBulkApprove={(rows) => alert(`Bulk approved ${rows.length} payslips`)}
        onBulkReject={(rows) => alert(`Bulk rejected ${rows.length} payslips`)}
        onBulkDelete={(rows) => alert(`Bulk deleted ${rows.length} payslips`)}
      />
    </div>
  )
}
