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
import { DataTableToolbar, DataTablePagination } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'

/** Variation type */
export type Variation = {
  variationId: string
  name: string
  projectId: string
  estimateId: string
  date: string
  status: 'Draft' | 'Approved' | 'Declined'
  description?: string
  amount: number
  total: number
  spent: number
  balance: number
}

/** Dummy variations */
const dummyVariations: Variation[] = [
  {
    variationId: 'VAR-001',
    name: 'Foundation Change',
    projectId: 'P-123',
    estimateId: 'EST-789',
    date: '2025-09-12',
    status: 'Draft',
    description: 'Adjustment for deeper foundation',
    amount: 5000,
    total: 5000,
    spent: 1200,
    balance: 3800,
  },
  {
    variationId: 'VAR-002',
    name: 'Roof Extension',
    projectId: 'P-456',
    estimateId: 'EST-222',
    date: '2025-09-15',
    status: 'Approved',
    description: 'Extended roof area with insulation',
    amount: 8000,
    total: 8000,
    spent: 5000,
    balance: 3000,
  },
]

/** Bulk actions for variations */
function VariationBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: TanTable<Variation>
  onBulkApprove?: (rows: Variation[]) => void
  onBulkReject?: (rows: Variation[]) => void
  onBulkDelete?: (rows: Variation[]) => void
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
            ? 'Delete Variations'
            : dialog.action === 'approve'
            ? 'Approve Variations'
            : 'Reject Variations'
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} variation(s)?`}
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
function getColumns(): ColumnDef<Variation>[] {
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
    { accessorKey: 'variationId', header: 'Variation ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'projectId', header: 'Project' },
    { accessorKey: 'estimateId', header: 'Estimate' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'status', header: 'Status' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      accessorKey: 'spent',
      header: 'Spent',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const variation = row.original
        return (
          <div className="flex gap-2">
            <button onClick={() => alert(`View ${variation.variationId}`)}><Eye className="w-4 h-4" /></button>
            <button onClick={() => alert(`Edit ${variation.variationId}`)}><Pencil className="w-4 h-4" /></button>
            <button onClick={() => alert(`Approve ${variation.variationId}`)}><Check className="w-4 h-4 text-green-600" /></button>
            <button onClick={() => alert(`Reject ${variation.variationId}`)}><X className="w-4 h-4 text-red-600" /></button>
            <button onClick={() => alert(`Delete ${variation.variationId}`)}><Trash className="w-4 h-4 text-red-700" /></button>
          </div>
        )
      },
    },
  ]
}

/** Main Table Component */
export function VariationTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data: dummyVariations,
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
        <DataTableToolbar table={table} searchPlaceholder="Search variations..." />
        <Button><Plus className="w-4 h-4 mr-2" /> Add Variation</Button>
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
      <VariationBulkActions
        table={table}
        onBulkApprove={(rows) => alert(`Bulk approved ${rows.length} variations`)}
        onBulkReject={(rows) => alert(`Bulk rejected ${rows.length} variations`)}
        onBulkDelete={(rows) => alert(`Bulk deleted ${rows.length} variations`)}
      />
    </div>
  )
}
