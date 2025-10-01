'use client'
import * as React from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
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

/** Wage type */
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

/** Dummy data */
const dummyWages: Wage[] = [
  {
    _id: '1',
    wageNumber: 'WG-001',
    company: 'Alpha Ltd',
    vendorName: 'Vendor A',
    status: 'pending',
    date: new Date().toISOString(),
    deliveryDate: new Date().toISOString(),
    amount: 1200,
  },
  {
    _id: '2',
    wageNumber: 'WG-002',
    company: 'Beta Corp',
    vendorName: 'Vendor B',
    status: 'approved',
    date: new Date().toISOString(),
    deliveryDate: new Date().toISOString(),
    amount: 2500,
  },
  {
    _id: '3',
    wageNumber: 'WG-003',
    company: 'Gamma Inc',
    vendorName: 'Vendor C',
    status: 'declined',
    date: new Date().toISOString(),
    deliveryDate: new Date().toISOString(),
    amount: 800,
  },
]

/** Bulk actions bar */
function WagesBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: TanTable<Wage>
  onBulkApprove?: (rows: Wage[]) => void
  onBulkReject?: (rows: Wage[]) => void
  onBulkDelete?: (rows: Wage[]) => void
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
            ? 'Delete Wages'
            : dialog.action === 'approve'
            ? 'Approve Wages'
            : 'Reject Wages'
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} wage(s)?`}
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

/** Columns definition with row actions */
function getColumns({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: {
  onView?: (w: Wage) => void
  onEdit?: (w: Wage) => void
  onDelete?: (w: Wage) => void
  onApprove?: (w: Wage) => void
  onReject?: (w: Wage) => void
}): ColumnDef<Wage>[] {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    wage?: Wage
    action?: 'approve' | 'reject' | 'delete'
  }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.wage || !dialog.action) return
    if (dialog.action === 'approve') onApprove?.(dialog.wage)
    if (dialog.action === 'reject') onReject?.(dialog.wage)
    if (dialog.action === 'delete') onDelete?.(dialog.wage)
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
    { accessorKey: 'wageNumber', header: 'Wage #' },
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
        const wage = row.original
        return (
          <div className="flex gap-2">
            <button onClick={() => onView?.(wage)} title="View">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit?.(wage)} title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setDialog({ open: true, wage, action: 'approve' })}>
              <Check className="w-4 h-4 text-green-600" />
            </button>
            <button onClick={() => setDialog({ open: true, wage, action: 'reject' })}>
              <X className="w-4 h-4 text-red-600" />
            </button>
            <button onClick={() => setDialog({ open: true, wage, action: 'delete' })}>
              <Trash className="w-4 h-4 text-red-700" />
            </button>

            <ConfirmDialog
              open={dialog.open}
              onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
              title={
                dialog.action === 'delete'
                  ? 'Delete Wage'
                  : dialog.action === 'approve'
                  ? 'Approve Wage'
                  : 'Reject Wage'
              }
              desc={
                dialog.wage
                  ? `Are you sure you want to ${dialog.action} ${dialog.wage.wageNumber}?`
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

/** Main demo table component */
export function WagesTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data: dummyWages,
    columns: getColumns({
      onView: (w) => alert(`Viewing ${w.wageNumber}`),
      onEdit: (w) => alert(`Editing ${w.wageNumber}`),
      onApprove: (w) => alert(`Approved ${w.wageNumber}`),
      onReject: (w) => alert(`Rejected ${w.wageNumber}`),
      onDelete: (w) => alert(`Deleted ${w.wageNumber}`),
    }),
    state: { sorting, columnVisibility, rowSelection },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableRowSelection: true,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DataTableToolbar
          table={table}
          searchPlaceholder="Search wages..."
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
        <Button onClick={() => alert('Add new wage')} className="ml-4">
          <Plus className="w-4 h-4 mr-2" />
          Add Wage
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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

      <WagesBulkActions
        table={table}
        onBulkApprove={(rows) => alert(`Bulk approved ${rows.length} wages`)}
        onBulkReject={(rows) => alert(`Bulk rejected ${rows.length} wages`)}
        onBulkDelete={(rows) => alert(`Bulk deleted ${rows.length} wages`)}
      />
    </div>
  )
}
