import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Eye, Pencil, Check, X, Trash, MoreHorizontal } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { PurchaseOrder } from '@/features/purchase-orders/components/purchaseOrders-table'

type Props = {
  po: PurchaseOrder
  onView?: (po: PurchaseOrder) => void
  onEdit?: (po: PurchaseOrder) => void
  onApprove?: (po: PurchaseOrder, close: () => void) => void
  onReject?: (po: PurchaseOrder, close: () => void) => void
  onDelete?: (po: PurchaseOrder, close: () => void) => void
}

export function DataTableActionMenu({
  po,
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: Props) {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'delete'
  }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.action) return
    if (dialog.action === 'approve') onApprove?.(po, () => setDialog({ open: false }))
    if (dialog.action === 'reject') onReject?.(po, () => setDialog({ open: false }))
    if (dialog.action === 'delete') onDelete?.(po, () => setDialog({ open: false }))
  }

  return (
    <>
      {/* Single trigger button for all actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="More actions">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onView?.(po)}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit?.(po)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          {po.status !== 'approved' && po.status !== 'declined' && (
            <>
              <DropdownMenuItem onClick={() => setDialog({ open: true, action: 'approve' })}>
                <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog({ open: true, action: 'reject' })}>
                <X className="mr-2 h-4 w-4 text-red-600" /> Reject
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem className="text-red-600" onClick={() => setDialog({ open: true, action: 'delete' })}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? 'Delete Purchase Order'
            : dialog.action === 'approve'
            ? 'Approve Purchase Order'
            : 'Reject Purchase Order'
        }
        desc={`Are you sure you want to ${dialog.action} this purchase order?`}
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
    </>
  )
}
