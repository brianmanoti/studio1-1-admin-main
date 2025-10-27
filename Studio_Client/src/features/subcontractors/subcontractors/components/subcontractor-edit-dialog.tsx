import { useSubcontractor } from "@/hooks/use-subcontractors"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubcontractorForm } from "./subcontractor-form"
import { Loader2 } from "lucide-react"

interface SubcontractorEditDialogProps {
  subcontractorId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubcontractorEditDialog({ subcontractorId, open, onOpenChange }: SubcontractorEditDialogProps) {
  const { data: subcontractor, isLoading } = useSubcontractor(subcontractorId || "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Subcontractor</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : subcontractor ? (
          <SubcontractorForm subcontractor={subcontractor} onSuccess={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
