"use client"

import { toast } from "react-toastify"
import { useNavigate, Link } from "react-router-dom"
import { Edit, Eye, FileText, MoreHorizontal, Trash } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEstimates, useDeleteEstimate } from "@/lib/hooks/useEstimates"

export function EstimatesTable() {
  const { data: estimates, isLoading, error } = useEstimates()
  const navigate = useNavigate()
  const deleteMutation = useDeleteEstimate()

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this estimate?")) {
      toast.promise(deleteMutation.mutateAsync(id), {
        pending: "Deleting estimate...",
        success: "Estimate deleted successfully",
        error: "Failed to delete estimate",
      })
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading estimates...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Error loading estimates: {(error as Error).message}
      </div>
    )
  }

  if (!estimates || estimates.length === 0) {
    return <div className="p-4 text-center">No estimates found.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-blue-700">
          Estimates
        </h2>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-blue-200 shadow-md overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-50">
            <TableRow>
              <TableHead className="text-blue-700">Estimate</TableHead>
              <TableHead className="text-blue-700">Project</TableHead>
              <TableHead className="text-blue-700">Client</TableHead>
              <TableHead className="text-blue-700">Date</TableHead>
              <TableHead className="text-blue-700">Amount</TableHead>
              <TableHead className="text-blue-700">Balance</TableHead>
              <TableHead className="text-blue-700">Total</TableHead>
              <TableHead className="text-blue-700">Status</TableHead>
              <TableHead className="text-right text-blue-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.map((estimate) => (
              <TableRow
                key={estimate._id}
                className="hover:bg-blue-50 cursor-pointer transition"
                onClick={() => navigate(`${estimate.estimateId}/view`)} // whole row click
              >
                <TableCell className="font-medium text-blue-800">
                  <div>{estimate.name ?? "N/A"}</div>
                  <div className="text-xs text-blue-500">
                    {estimate.estimateId ?? "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  {estimate.projectId ? (
                    <Link
                      to={`/projects/${estimate.projectId._id}`}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {estimate.projectId.name ?? "N/A"}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="text-gray-700">
                  {estimate.clientId?.primaryContact ?? "N/A"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {estimate.date
                    ? new Date(estimate.date).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell className="text-gray-700">
                  ${estimate.amount?.toLocaleString() ?? 0}
                </TableCell>
                <TableCell className="text-gray-700">
                  ${estimate.balance?.toLocaleString() ?? 0}
                </TableCell>
                <TableCell className="text-gray-700">
                  ${estimate.total?.toLocaleString() ?? 0}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      estimate.status === "Approved"
                        ? "success"
                        : estimate.status === "Pending"
                        ? "default"
                        : estimate.status === "Draft"
                        ? "secondary"
                        : estimate.status === "Rejected"
                        ? "destructive"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {estimate.status ?? "N/A"}
                  </Badge>
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()} // prevent row click
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => navigate(`/estimates/${estimate.estimateId}`)}
                      >
                        <Eye className="mr-2 h-4 w-4 text-blue-600" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(`/estimates/${estimate.estimateId}/edit`)
                        }
                      >
                        <Edit className="mr-2 h-4 w-4 text-blue-600" />
                        Edit Estimate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(estimate.estimateId)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Estimate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
