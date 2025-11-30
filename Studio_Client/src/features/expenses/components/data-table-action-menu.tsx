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

type BaseRow = { _id: string; status?: string }

interface DataTableActionMenuProps<T extends BaseRow> {
  row: T
  entityName?: string
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onApprove?: (row: T, close: () => void) => void
  onReject?: (row: T, close: () => void) => void
  onDelete?: (row: T, close: () => void) => void
  isMutating?: boolean
}

export function DataTableActionMenu<T extends BaseRow>({
  row,
  entityName = 'item',
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  isMutating = false,
}: DataTableActionMenuProps<T>) {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'delete'
  }>({ open: false })

  const handleConfirm = () => {
    if (!dialog.action) return
    if (dialog.action === 'approve') onApprove?.(row, () => setDialog({ open: false }))
    if (dialog.action === 'reject') onReject?.(row, () => setDialog({ open: false }))
    if (dialog.action === 'delete') onDelete?.(row, () => setDialog({ open: false }))
  }

  const disabled = isMutating

  return (
    <>
      {/* Single trigger button for all actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="More actions" disabled={disabled}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => onView?.(row)} disabled={disabled}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit?.(row)} disabled={disabled}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          {row.status !== 'approved' && row.status !== 'declined' && (
            <>
              <DropdownMenuItem onSelect={() => setDialog({ open: true, action: 'approve' })} disabled={disabled}>
                <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog({ open: true, action: 'reject' })} disabled={disabled}>
                <X className="mr-2 h-4 w-4 text-red-600" /> Reject
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem className="text-red-600" onSelect={() => setDialog({ open: true, action: 'delete' })} disabled={disabled}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={
          dialog.action === 'delete'
            ? `Delete ${entityName}`
            : dialog.action === 'approve'
            ? `Approve ${entityName}`
            : `Reject ${entityName}`
        }
        desc={`Are you sure you want to ${dialog.action} this ${entityName}?`}
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
