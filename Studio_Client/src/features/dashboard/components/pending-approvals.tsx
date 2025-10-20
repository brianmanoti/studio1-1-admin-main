import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PendingApprovalsProps {
  approvals: Array<{
    _id: string
    reference: string
    company: string
    vendorName: string
    amount: number
    date: string
    status: string
  }>
}

export function PendingApprovals({ approvals }: PendingApprovalsProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pending Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Company
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Vendor
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Reference
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.slice(0, 10).map((approval) => (
                <TableRow
                  key={approval._id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <TableCell className="text-sm font-medium text-foreground">{approval.company}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{approval.vendorName}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{approval.reference}</TableCell>
                  <TableCell className="text-sm font-semibold text-foreground text-right">
                    ${approval.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(approval.date)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs font-medium ${getStatusColor(approval.status)}`}>
                      {approval.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
