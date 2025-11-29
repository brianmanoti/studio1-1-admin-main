"use client"

import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table"
import { useSubcontractors, useDeleteSubcontractor, useUpdateSubcontractorStatus, type Subcontractor } from "@/hooks/use-subcontractors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowUpDown, ChevronLeft, ChevronRight, Plus, MoreHorizontal, Eye, Edit, Trash2, Loader2, DollarSign, CheckCircle, XCircle } from "lucide-react"
import { SubcontractorCreateDialog } from "./subcontractor-create-dialog"
import { SubcontractorViewDialog } from "./subcontractor-view-dialog"
import { SubcontractorEditDialog } from "./subcontractor-edit-dialog"
import { BudgetAllocationDialog } from "./budget-allocation-dialog"

const columns: ColumnDef<Subcontractor>[] = [
  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0">
        Company Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("companyName")}</div>,
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
    cell: ({ row }) => <div className="text-sm">{row.getValue("contactPerson")}</div>,
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => <div className="text-sm">{row.getValue("phoneNumber")}</div>,
  },
  {
    accessorKey: "typeOfWork",
    header: "Type of Work",
    cell: ({ row }) => <div className="text-sm">{row.getValue("typeOfWork")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColors: Record<string, string> = {
        approved: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        declined: "bg-red-100 text-red-800",
      }
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || "bg-gray-100 text-gray-800"}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
  {
    accessorKey: "totalAllocatedBudget",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0">
        Allocated Budget
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const budget = Number.parseFloat(row.getValue("totalAllocatedBudget") || "0")
      return <div className="font-semibold">KES {budget.toLocaleString("en-KE")}</div>
    },
  },
  {
    accessorKey: "totalSpent",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0">
        Total Spent
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const spent = Number.parseFloat(row.getValue("totalSpent") || "0")
      return <div className="font-semibold">KES {spent.toLocaleString("en-KE")}</div>
    },
  },
  {
    accessorKey: "netBalance",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 p-0">
        Net Balance
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const balance = Number.parseFloat(row.getValue("netBalance") || "0")
      const color = balance >= 0 ? "text-green-600" : "text-red-600"
      return <div className={`font-semibold ${color}`}>KES {balance.toLocaleString("en-KE")}</div>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionCell subcontractor={row.original} />,
  },
]

function ActionCell({ subcontractor }: { subcontractor: Subcontractor }) {
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  
  const deleteMutation = useDeleteSubcontractor()
  const approveMutation = useUpdateSubcontractorStatus()
  const rejectMutation = useUpdateSubcontractorStatus()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(subcontractor._id)
      setDeleteOpen(false)
    } catch (error) {
      console.error("[v0] Delete error:", error)
    }
  }

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: subcontractor._id,
        action: 'approve'
      })
      setApproveOpen(false)
    } catch (error) {
      console.error("[v0] Approve error:", error)
    }
  }

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        id: subcontractor._id,
        action: 'reject'
      })
      setRejectOpen(false)
    } catch (error) {
      console.error("[v0] Reject error:", error)
    }
  }

  const isPending = subcontractor.status === "pending"
  const isLoading = deleteMutation.isPending || approveMutation.isPending || rejectMutation.isPending

  return (
    <>
      <div className="flex items-center gap-2">
        {isPending && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveOpen(true)}
              disabled={isLoading}
              className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectOpen(true)}
              disabled={isLoading}
              className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => setViewOpen(true)} 
              disabled={isLoading}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setEditOpen(true)} 
              disabled={isLoading}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setBudgetOpen(true)} 
              disabled={isLoading}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Allocate Budget
            </DropdownMenuItem>
            {isPending && (
              <>
                <DropdownMenuItem 
                  onClick={() => setApproveOpen(true)} 
                  disabled={isLoading}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setRejectOpen(true)} 
                  disabled={isLoading}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem 
              onClick={() => setDeleteOpen(true)} 
              disabled={isLoading}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SubcontractorViewDialog 
        subcontractorId={subcontractor._id} 
        open={viewOpen} 
        onOpenChange={setViewOpen} 
      />
      <SubcontractorEditDialog 
        subcontractorId={subcontractor._id} 
        open={editOpen} 
        onOpenChange={setEditOpen} 
      />
      <BudgetAllocationDialog 
        subcontractor={subcontractor} 
        open={budgetOpen} 
        onOpenChange={setBudgetOpen} 
      />

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subcontractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {subcontractor.companyName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-destructive">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Alert Dialog */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Subcontractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {subcontractor.companyName}? This will change their status to approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={approveMutation.isPending} className="bg-green-600">
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Alert Dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Subcontractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {subcontractor.companyName}? This will change their status to declined.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={rejectMutation.isPending} className="bg-red-600">
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function SubcontractorsTable() {
  const { data: subcontractors = [], isLoading, error } = useSubcontractors()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  const table = useReactTable({
    data: subcontractors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading subcontractors...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading subcontractors. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search subcontractors..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Subcontractor
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No subcontractors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          of {table.getFilteredRowModel().rows.length} subcontractors
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SubcontractorCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}