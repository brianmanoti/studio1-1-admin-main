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
import { Eye, Pencil, Trash, Check, X, Plus, Loader2 } from 'lucide-react'
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
import axiosInstance from '@/lib/axios'
import { useNavigate } from '@tanstack/react-router'

// ✅ Type definition
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

// ✅ Fetch all variations
export async function fetchVariations(): Promise<Variation[]> {
  const { data } = await axiosInstance.get<Variation[]>('/api/variations')
  return data
}

// ✅ Approve variation
export async function approveVariation(id: string) {
  const { data } = await axiosInstance.patch(`/api/variations/${id}/approve`)
  return data
}

// ✅ Reject variation
export async function rejectVariation(id: string) {
  const { data } = await axiosInstance.patch(`/api/variations/${id}/reject`)
  return data
}

// ✅ Delete variation
export async function deleteVariation(id: string) {
  const { data } = await axiosInstance.delete(`/api/variations/${id}`)
  return data
}



/** Bulk actions */
function VariationBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: TanTable<Variation>
  onBulkApprove: (rows: Variation[]) => void
  onBulkReject: (rows: Variation[]) => void
  onBulkDelete: (rows: Variation[]) => void
}) {
  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const [dialog, setDialog] = React.useState<{ open: boolean; action?: 'approve' | 'reject' | 'delete' }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.action) return
    if (dialog.action === 'approve') onBulkApprove(selected)
    if (dialog.action === 'reject') onBulkReject(selected)
    if (dialog.action === 'delete') onBulkDelete(selected)
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

/** ✅ Table columns */
function getColumns(
  handleAction: (id: string, action: 'approve' | 'reject' | 'delete') => void
): ColumnDef<Variation>[] {
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
        const v = row.original
        return (
          <div className="flex gap-2">
            <button><Eye className="w-4 h-4" /></button>
            <button><Pencil className="w-4 h-4" /></button>
            <button onClick={() => handleAction(v.variationId, 'approve')}><Check className="w-4 h-4 text-green-600" /></button>
            <button onClick={() => handleAction(v.variationId, 'reject')}><X className="w-4 h-4 text-red-600" /></button>
            <button onClick={() => handleAction(v.variationId, 'delete')}><Trash className="w-4 h-4 text-red-700" /></button>
          </div>
        )
      },
    },
  ]
}

/** ✅ Main Table Component */
export function VariationTable() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 🔹 Fetch variations
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['variations'],
    queryFn: fetchVariations,
  })

  // 🔹 Single mutations
  const approveMutation = useMutation({ mutationFn: approveVariation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['variations'] }) })
  const rejectMutation = useMutation({ mutationFn: rejectVariation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['variations'] }) })
  const deleteMutation = useMutation({ mutationFn: deleteVariation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['variations'] }) })

  const handleAction = (id: string, action: 'approve' | 'reject' | 'delete') => {
    if (action === 'approve') approveMutation.mutate(id)
    if (action === 'reject') rejectMutation.mutate(id)
    if (action === 'delete') deleteMutation.mutate(id)
  }

  // ✅ Table states
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data: data ?? [],
    columns: getColumns(handleAction),
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

  // ✅ Handle loading, error, empty
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        <span>Loading variations...</span>
      </div>
    )

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <p className="text-red-600 mb-2">Failed to load variations.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )

  if (!data?.length)
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
        <p>No variations found.</p>
        <Button
          onClick={() => navigate({ to: `/projects/$projectId/estimates/variations/new` })}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Variation
        </Button>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <DataTableToolbar table={table} searchPlaceholder="Search variations..." />
        <Button
          onClick={() => navigate({ to: `/projects/$projectId/estimates/variations/new` })}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Variation
        </Button>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <VariationBulkActions
        table={table}
        onBulkApprove={(rows) => rows.forEach((r) => approveMutation.mutate(r.variationId))}
        onBulkReject={(rows) => rows.forEach((r) => rejectMutation.mutate(r.variationId))}
        onBulkDelete={(rows) => rows.forEach((r) => deleteMutation.mutate(r.variationId))}
      />
    </div>
  )
}
