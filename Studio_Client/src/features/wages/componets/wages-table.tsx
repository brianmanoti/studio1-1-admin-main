'use client'

import * as React from 'react'
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { Eye, Pencil, Check, X, Trash, Plus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableToolbar, DataTablePagination } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { useNavigate } from '@tanstack/react-router'

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

/** Convert MongoDB ISO string to readable Kenyan date */
export function formatKenyaDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Format amount to Kenyan Shillings */
export function formatKES(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount ?? 0)
}

export function WagesTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'delete'
    wage?: Wage
    bulk?: boolean
    rows?: Wage[]
  }>({ open: false })

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectId = '68de8b6a157949fa127747a1'

  // --- Fetch wages ---
  const { data: wages = [], isLoading, isError } = useQuery({
    queryKey: ['wages', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const res = await axiosInstance.get(`/api/wages`)
      return res.data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })

  // --- Mutations ---
  const mutateAction = useMutation({
    mutationFn: async ({
      action,
      ids,
    }: {
      action: 'approve' | 'reject' | 'delete'
      ids: string[]
    }) => {
      const endpoint =
        action === 'approve'
          ? '/api/wages/approve'
          : action === 'reject'
          ? '/api/wages/reject'
          : '/api/wages/delete'
      await axiosInstance.post(endpoint, { ids })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wages', projectId])
      setDialog({ open: false })
      setRowSelection({})
    },
  })

  const handleConfirm = () => {
    if (!dialog.action) return
    const ids = dialog.bulk
      ? dialog.rows?.map((w) => w._id) ?? []
      : dialog.wage
      ? [dialog.wage._id]
      : []

    mutateAction.mutate({ action: dialog.action, ids })
  }

  // --- Table config ---
  const table = useReactTable({
    data: wages ?? [],
    columns: React.useMemo<ColumnDef<Wage>[]>(
      () => [
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
        { accessorKey: 'wageNumber', header: 'Wage #' },
        { accessorKey: 'company', header: 'Company' },
        { accessorKey: 'vendorName', header: 'Vendor' },
        { accessorKey: 'status', header: 'Status' },
        {
          accessorKey: 'date',
          header: 'Date',
          cell: ({ getValue }) => formatKenyaDate(getValue() as string),
        },
        {
          accessorKey: 'deliveryDate',
          header: 'Delivery',
          cell: ({ getValue }) => formatKenyaDate(getValue() as string),
        },
        {
          accessorKey: 'amount',
          header: 'Amount',
          cell: ({ getValue }) => formatKES(getValue() as number),
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => {
            const wage = row.original
            if (!wage) return null
            return (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate({ to: `/projects/${projectId}/wages/${wage._id}` })}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    navigate({ to: `/projects/${projectId}/wages/${wage._id}/edit` })
                  }
                >
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
              </div>
            )
          },
        },
      ],
      [navigate]
    ),
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

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)

  if (!projectId) return <div>Project ID is missing.</div>
  if (isLoading) return <div>Loading wages...</div>
  if (isError) return <div>Failed to load wages.</div>

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
        <Button
          onClick={() => navigate({ to: `/projects/${projectId}/wages/new` })}
          className="ml-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Wage
        </Button>
      </div>

      <div className="overflow-auto rounded-md border">
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
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
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {selectedRows.length > 0 && (
        <div className="flex gap-2 p-2 border rounded-md bg-gray-50">
          <span className="text-sm text-gray-600">{selectedRows.length} selected</span>
          <Button
            size="sm"
            onClick={() =>
              setDialog({ open: true, action: 'approve', bulk: true, rows: selectedRows })
            }
          >
            Approve
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setDialog({ open: true, action: 'reject', bulk: true, rows: selectedRows })
            }
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              setDialog({ open: true, action: 'delete', bulk: true, rows: selectedRows })
            }
          >
            Delete
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? dialog.bulk
              ? 'Delete Wages'
              : 'Delete Wage'
            : dialog.action === 'approve'
            ? dialog.bulk
              ? 'Approve Wages'
              : 'Approve Wage'
            : dialog.bulk
            ? 'Reject Wages'
            : 'Reject Wage'
        }
        desc={
          dialog.bulk
            ? `Are you sure you want to ${dialog.action} ${dialog.rows?.length ?? 0} wage(s)?`
            : `Are you sure you want to ${dialog.action} ${dialog.wage?.wageNumber ?? ''}?`
        }
        destructive={dialog.action === 'delete' || dialog.action === 'reject'}
        handleConfirm={handleConfirm}
      />
    </div>
  )
}
