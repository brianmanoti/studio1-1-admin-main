'use client'

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

type BaseRow = {
  _id: string
  status?: string
  [key: string]: any
}

interface DataTableActionMenuProps<T extends BaseRow> {
  row: T
  entityName?: string // e.g., "wage", "purchase order"
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onApprove?: (row: T, close: () => void) => void
  onReject?: (row: T, close: () => void) => void
  onDelete?: (row: T, close: () => void) => void
  isMutating?: boolean
}

/**
 * Responsive, accessible action menu used across tables (Wages, POs, etc.)
 */
export function DataTableActionMenu<T extends BaseRow>({
  row,
  entityName = 'item',
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  isMutating,
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

  const ActionButtons = (
    <div className="hidden md:flex items-center space-x-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onView?.(row)}
        aria-label="View"
        disabled={disabled}
      >
        <Eye className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onEdit?.(row)}
        aria-label="Edit"
        disabled={disabled}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      {row.status !== 'approved' && row.status !== 'declined' && (
        <>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setDialog({ open: true, action: 'approve' })}
            aria-label="Approve"
            disabled={disabled}
          >
            <Check className="w-4 h-4 text-green-600" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setDialog({ open: true, action: 'reject' })}
            aria-label="Reject"
            disabled={disabled}
          >
            <X className="w-4 h-4 text-red-600" />
          </Button>
        </>
      )}
      <Button
        size="icon"
        variant="destructive"
        onClick={() => setDialog({ open: true, action: 'delete' })}
        aria-label="Delete"
        disabled={disabled}
      >
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  )

  const ActionDropdown = (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="More actions" disabled={disabled}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onView?.(row)} disabled={disabled}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit?.(row)} disabled={disabled}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          {row.status !== 'approved' && row.status !== 'declined' && (
            <>
              <DropdownMenuItem
                onClick={() => setDialog({ open: true, action: 'approve' })}
                disabled={disabled}
              >
                <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDialog({ open: true, action: 'reject' })}
                disabled={disabled}
              >
                <X className="mr-2 h-4 w-4 text-red-600" /> Reject
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setDialog({ open: true, action: 'delete' })}
            disabled={disabled}
          >
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <>
      {ActionButtons}
      {ActionDropdown}

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
