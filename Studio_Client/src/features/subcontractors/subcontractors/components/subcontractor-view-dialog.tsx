import { useSubcontractor } from "@/hooks/use-subcontractors"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface SubcontractorViewDialogProps {
  subcontractorId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubcontractorViewDialog({ subcontractorId, open, onOpenChange }: SubcontractorViewDialogProps) {
  const { data: subcontractor, isLoading } = useSubcontractor(subcontractorId || "")

  if (!subcontractor && !isLoading) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subcontractor Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : subcontractor ? (
          <div className="space-y-6">
            {/* Company Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Company Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Company Name</p>
                  <p className="font-medium">{subcontractor.companyName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{subcontractor.contactPerson}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{subcontractor.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{subcontractor.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type of Work</p>
                  <p className="font-medium">{subcontractor.typeOfWork}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{subcontractor.status}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Financial Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Allocated Budget</p>
                  <p className="font-medium">KES {subcontractor.totalAllocatedBudget.toLocaleString("en-KE")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Spent</p>
                  <p className="font-medium">KES {subcontractor.totalSpent.toLocaleString("en-KE")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Payments</p>
                  <p className="font-medium">KES {subcontractor.totalPayments.toLocaleString("en-KE")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Balance</p>
                  <p className="font-medium text-green-600">KES {subcontractor.netBalance.toLocaleString("en-KE")}</p>
                </div>
              </div>
            </div>

            {/* Projects */}
            {subcontractor.projects.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Projects</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project ID</TableHead>
                        <TableHead>Allocated Budget</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subcontractor.projects.map((project) => (
                        <TableRow key={project.projectId}>
                          <TableCell className="text-sm">{project.projectId}</TableCell>
                          <TableCell className="text-sm">
                            KES {project.allocatedBudget.toLocaleString("en-KE")}
                          </TableCell>
                          <TableCell className="text-sm">{project.progress}%</TableCell>
                          <TableCell className="text-sm">KES {project.balance.toLocaleString("en-KE")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Payments */}
            {subcontractor.payments.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Payments</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subcontractor.payments.map((payment, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">
                            {new Date(payment.date).toLocaleDateString("en-KE")}
                          </TableCell>
                          <TableCell className="text-sm">KES {payment.amount.toLocaleString("en-KE")}</TableCell>
                          <TableCell className="text-sm">{payment.reference}</TableCell>
                          <TableCell className="text-sm">{payment.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
