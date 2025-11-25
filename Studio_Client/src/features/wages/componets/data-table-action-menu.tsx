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
  isMutating,
}: DataTableActionMenuProps<T>) {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'delete'
  }>({ open: false })

  const [loadingAction, setLoadingAction] = React.useState<'approve' | 'reject' | 'delete' | null>(null)

  const handleConfirm = () => {
    if (!dialog.action) return

    setLoadingAction(dialog.action)
    const close = () => {
      setDialog({ open: false })
      setLoadingAction(null)
    }

    if (dialog.action === 'approve') onApprove?.(row, close)
    if (dialog.action === 'reject') onReject?.(row, close)
    if (dialog.action === 'delete') onDelete?.(row, close)
  }

  const disabled = isMutating || loadingAction !== null

  const Spinner = () => (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  )

  const ActionButtons = (
    <div className="hidden md:flex items-center space-x-2">
      <Button size="icon" variant="ghost" onClick={() => onView?.(row)} aria-label="View" disabled={disabled}>
        <Eye className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onEdit?.(row)} aria-label="Edit" disabled={disabled}>
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
            {loadingAction === 'approve' ? <Spinner /> : <Check className="w-4 h-4 text-green-600" />}
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() => setDialog({ open: true, action: 'reject' })}
            aria-label="Reject"
            disabled={disabled}
          >
            {loadingAction === 'reject' ? <Spinner /> : <X className="w-4 h-4 text-red-600" />}
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
        {loadingAction === 'delete' ? <Spinner /> : <Trash className="w-4 h-4" />}
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
              <DropdownMenuItem onClick={() => setDialog({ open: true, action: 'approve' })} disabled={disabled}>
                {loadingAction === 'approve' ? <Spinner /> : <Check className="mr-2 h-4 w-4 text-green-600" />} Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog({ open: true, action: 'reject' })} disabled={disabled}>
                {loadingAction === 'reject' ? <Spinner /> : <X className="mr-2 h-4 w-4 text-red-600" />} Reject
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => setDialog({ open: true, action: 'delete' })} className="text-red-600" disabled={disabled}>
            {loadingAction === 'delete' ? <Spinner /> : <Trash className="mr-2 h-4 w-4" />} Delete
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
