
'use client';

import * as React from 'react';
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
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Check, X, Trash, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTableToolbar, DataTablePagination } from '@/components/data-table';
import { useNavigate } from '@tanstack/react-router';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { useProjectStore } from '@/stores/projectStore';
import { DataTableActionMenu } from '@/features/purchase-orders/components/data-table-action-menu';

export type PurchaseOrder = {
  _id: string;
  poNumber: string;
  company: string;
  vendorName: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'declined' | 'approved';
  date: string;
  deliveryDate: string;
  amount: number;
};

/** ---------- Bulk Actions ---------- */
function PurchaseOrdersBulkActions({
  table,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
}: {
  table: ReturnType<typeof useReactTable<PurchaseOrder>>;
  onBulkApprove?: (rows: PurchaseOrder[]) => void;
  onBulkReject?: (rows: PurchaseOrder[]) => void;
  onBulkDelete?: (rows: PurchaseOrder[]) => void;
}) {
  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    action?: 'approve' | 'reject' | 'delete';
  }>({ open: false });

  const handleConfirm = () => {
    if (!dialog.action) return;
    if (dialog.action === 'approve') onBulkApprove?.(selected);
    if (dialog.action === 'reject') onBulkReject?.(selected);
    if (dialog.action === 'delete') onBulkDelete?.(selected);
    setDialog({ open: false });
  };

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
      <span className="text-sm text-gray-600">{selected.length} selected</span>
      <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, action: 'approve' })}>
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, action: 'reject' })}>
        Reject
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setDialog({ open: true, action: 'delete' })}>
        Delete
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? 'Delete Purchase Orders'
            : dialog.action === 'approve'
            ? 'Approve Purchase Orders'
            : 'Reject Purchase Orders'
        }
        desc={`Are you sure you want to ${dialog.action} ${selected.length} order(s)?`}
        destructive={dialog.action === 'delete' || dialog.action === 'reject'}
        handleConfirm={handleConfirm}
        confirmText={dialog.action === 'delete' ? 'Delete' : dialog.action === 'approve' ? 'Approve' : 'Reject'}
      />
    </div>
  );
}

/** ---------- Status Color Helper ---------- */
function getStatusColor(status: PurchaseOrder['status']) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'declined':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'in-transit':
      return 'bg-blue-100 text-blue-700';
    case 'delivered':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/** ---------- Columns ---------- */
function getColumns({
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: {
  onView?: (po: PurchaseOrder) => void;
  onEdit?: (po: PurchaseOrder) => void;
  onApprove?: (po: PurchaseOrder, closeDialog: () => void) => void;
  onReject?: (po: PurchaseOrder, closeDialog: () => void) => void;
  onDelete?: (po: PurchaseOrder, closeDialog: () => void) => void;
}): ColumnDef<PurchaseOrder>[] {
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
        const status = getValue() as PurchaseOrder['status'];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString('en-KE'),
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery',
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString('en-KE'),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => {
        const amount = getValue() as number;
        return new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES',
        }).format(amount);
      },
    },
{
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => {
    const po = row.original
    return (
      <DataTableActionMenu
        po={po}
        onView={onView}
        onEdit={onEdit}
        onApprove={onApprove}
        onReject={onReject}
        onDelete={onDelete}
      />
    )
  },
},
  ];
}

/** ---------- Main Table ---------- */
export function PurchaseOrderTable() {
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const projectId = useProjectStore((state) => state.projectId);

  /** Data */
  const { data: purchaseOrders = [], isLoading, isError } = useQuery({
    queryKey: ['purchaseOrders', projectId],
    queryFn: async () => (await axiosInstance.get(`/api/purchase-orders/project/${projectId}`)).data.data,
    enabled: !!projectId,
  });

  /** Mutations */
  const approveMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/purchase-orders/${id}/approve`),
    onSuccess: (_, id, ctx: any) => {
      toast.success('Purchase order approved.');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] });
      ctx?.closeDialog?.();
    },
    onError: () => toast.error('Failed to approve purchase order.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/api/purchase-orders/${id}/decline`),
    onSuccess: (_, id, ctx: any) => {
      toast.success('Purchase order rejected.');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] });
      ctx?.closeDialog?.();
    },
    onError: () => toast.error('Failed to reject purchase order.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/api/purchase-orders/${id}`),
    onSuccess: (_, id, ctx: any) => {
      toast.success('Purchase order deleted.');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', projectId] });
      ctx?.closeDialog?.();
    },
    onError: () => toast.error('Failed to delete purchase order.'),
  });

  const handleBulk = (rows: PurchaseOrder[], action: 'approve' | 'reject' | 'delete') =>
    rows.forEach((r) => {
      if (action === 'approve') approveMutation.mutate(r._id);
      if (action === 'reject') rejectMutation.mutate(r._1d);
      if (action === 'delete') deleteMutation.mutate(r._id);
    });

  /** Table setup */
  const table = useReactTable({
    data: purchaseOrders,
    columns: getColumns({
      onView: (po) => navigate({ to: `/projects/${projectId}/purchaseOrders/${po._id}` }),
      onEdit: (po) => navigate({ to: `/projects/${projectId}/purchaseOrders/${po._id}/edit` }),
      onApprove: (po, closeDialog) => approveMutation.mutate(po._id, { context: { closeDialog } }),
      onReject: (po, closeDialog) => rejectMutation.mutate(po._id, { context: { closeDialog } }),
      onDelete: (po, closeDialog) => deleteMutation.mutate(po._1d, { context: { closeDialog } }),
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
  });

  if (isLoading) return <div>Loading purchase orders…</div>;
  if (isError) return <div>Failed to load purchase orders.</div>;

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <Button onClick={() => navigate({ to: `/projects/${projectId}/purchaseOrders/new` })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase Order
        </Button>
      </div>

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
                  onClick={() =>
                    navigate({ to: `/projects/${projectId}/purchaseOrders/${row.original._id}` })
                  }
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
      />
    </div>
  );
}
