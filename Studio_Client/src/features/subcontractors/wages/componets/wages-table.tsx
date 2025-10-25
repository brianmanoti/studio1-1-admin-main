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
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/projectStore'

/* ------------------------------ Types ------------------------------ */
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

/* ------------------------------ Utils ------------------------------ */
export const formatKenyaDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatKES = (amount: number): string =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount ?? 0)

/* ------------------------------ Component ------------------------------ */
export function SubWagesTable() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectId = useProjectStore((state) => state.projectId)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'delete'
    wage?: Wage
    bulk?: boolean
    rows?: Wage[]
  }>({ open: false })

  /* ------------------------------ Fetch ------------------------------ */
  const {
    data: wages = [],
    isLoading,
    isError,
    error,
  } = useQuery<Wage[]>({
    queryKey: ['wages', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const res = await axiosInstance.get(`/api/wages/project/${projectId}`)
      return res.data ?? []
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // cache for 5 mins
    retry: 2, // avoid infinite retries
  })

  /* ------------------------------ Mutations ------------------------------ */
  const mutateAction = useMutation({
    mutationFn: async ({
      action,
      ids,
    }: {
      action: 'approve' | 'reject' | 'delete'
      ids: string[]
    }) => {
      const requests = ids.map((id) => {
        if (action === 'approve') return axiosInstance.patch(`/api/wages/${id}/approve`)
        if (action === 'reject') return axiosInstance.patch(`/api/wages/${id}/reject`)
        return axiosInstance.delete(`/api/wages/${id}`)
      })
      await Promise.all(requests)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wages', projectId] })
      setDialog({ open: false })
      setRowSelection({})
      toast.success(
        variables.action === 'delete'
          ? 'Wage(s) deleted successfully.'
          : variables.action === 'approve'
          ? 'Wage(s) approved successfully.'
          : 'Wage(s) rejected successfully.'
      )
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Action failed. Please try again.')
    },
  })

  const handleConfirm = React.useCallback(() => {
    if (!dialog.action) return
    const ids =
      dialog.bulk && dialog.rows
        ? dialog.rows.map((w) => w._id)
        : dialog.wage
        ? [dialog.wage._id]
        : []

    if (ids.length === 0) return toast.warning('No wages selected.')
    mutateAction.mutate({ action: dialog.action, ids })
  }, [dialog, mutateAction])

  /* ------------------------------ Table ------------------------------ */
  const columns = React.useMemo<ColumnDef<Wage>[]>(
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
          return (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => navigate({ to: `/projects/${projectId}/wages/${wage._id}` })}
                aria-label="View wage"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate({ to: `/projects/${projectId}/wages/${wage._id}/edit` })}
                aria-label="Edit wage"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDialog({ open: true, wage, action: 'approve' })}
                aria-label="Approve wage"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={() => setDialog({ open: true, wage, action: 'reject' })}
                aria-label="Reject wage"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
              <button
                onClick={() => setDialog({ open: true, wage, action: 'delete' })}
                aria-label="Delete wage"
              >
                <Trash className="w-4 h-4 text-red-700" />
              </button>
            </div>
          )
        },
      },
    ],
    [navigate, projectId]
  )

  const table = useReactTable({
    data: wages ?? [],
    columns,
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

  /* ------------------------------ Render ------------------------------ */
  if (!projectId)
    return <div className="text-sm text-red-600">Project ID missing. Please select a project.</div>
  if (isLoading) return <div className="text-sm text-gray-500">Loading wages...</div>
  if (isError) return <div className="text-sm text-red-600">Failed to load wages: {String(error)}</div>

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
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
          onClick={() => navigate({ to: `/projects/${projectId}/subcontractors/wages/new` })}
          className="ml-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Wage
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
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
                  className="h-24 text-center text-sm text-gray-500"
                >
                  No wages found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex gap-2 p-2 border rounded-md bg-gray-50 text-sm">
          <span className="text-gray-600">{selectedRows.length} selected</span>
          <Button
            size="sm"
            disabled={mutateAction.isPending}
            onClick={() => setDialog({ open: true, action: 'approve', bulk: true, rows: selectedRows })}
          >
            Approve
          </Button>
          <Button
            size="sm"
            disabled={mutateAction.isPending}
            onClick={() => setDialog({ open: true, action: 'reject', bulk: true, rows: selectedRows })}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={mutateAction.isPending}
            onClick={() => setDialog({ open: true, action: 'delete', bulk: true, rows: selectedRows })}
          >
            Delete
          </Button>
        </div>
      )}

      {/* Confirmation dialog */}
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
        disabled={mutateAction.isPending}
      />
    </div>
  )
}
