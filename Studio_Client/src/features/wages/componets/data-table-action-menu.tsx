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
  isMutating = false,
}: DataTableActionMenuProps<T>) {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    action?: 'approve' | 'reject' | 'delete'
  }>({ open: false })

  const [loadingAction, setLoadingAction] = React.useState<'approve' | 'reject' | 'delete' | null>(null)

  const disabled = isMutating || loadingAction !== null

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )

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

  const actionItems = [
    { label: 'View', icon: <Eye className="mr-2 h-4 w-4" />, onClick: () => onView?.(row) },
    { label: 'Edit', icon: <Pencil className="mr-2 h-4 w-4" />, onClick: () => onEdit?.(row) },
  ]

  const conditionalActions = row.status !== 'approved' && row.status !== 'declined'
    ? [
        {
          label: 'Approve',
          icon: loadingAction === 'approve' ? <Spinner /> : <Check className="mr-2 h-4 w-4 text-green-600" />,
          onClick: () => setDialog({ open: true, action: 'approve' }),
        },
        {
          label: 'Reject',
          icon: loadingAction === 'reject' ? <Spinner /> : <X className="mr-2 h-4 w-4 text-red-600" />,
          onClick: () => setDialog({ open: true, action: 'reject' }),
        },
      ]
    : []

  const deleteAction = {
    label: 'Delete',
    icon: loadingAction === 'delete' ? <Spinner /> : <Trash className="mr-2 h-4 w-4" />,
    onClick: () => setDialog({ open: true, action: 'delete' }),
    destructive: true,
  }

  return (
    <>
      {/* Single dropdown trigger for all screens */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="More actions" disabled={disabled}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {actionItems.map((action) => (
            <DropdownMenuItem key={action.label} onClick={action.onClick} disabled={disabled}>
              {action.icon} {action.label}
            </DropdownMenuItem>
          ))}
          {conditionalActions.map((action) => (
            <DropdownMenuItem key={action.label} onClick={action.onClick} disabled={disabled}>
              {action.icon} {action.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={deleteAction.onClick} disabled={disabled} className="text-red-600">
            {deleteAction.icon} {deleteAction.label}
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
