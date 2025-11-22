import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import SubcontractorForm from "./subcontractor-form"


interface SubcontractorCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubcontractorCreateDialog({ open, onOpenChange }: SubcontractorCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Subcontractor</DialogTitle>
        </DialogHeader>
        <SubcontractorForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
