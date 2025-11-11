import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState, useMemo } from "react"
import { useVendors, useDeleteVendor, useUpdateVendor } from "@/hooks/use-vendors"
import VendorModal from "./VendorModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"

export function VendorsTable() {
  const navigate = useNavigate()

  const { data: vendors = [], isLoading, error } = useVendors()
  const deleteVendor = useDeleteVendor()
  const updateVendor = useUpdateVendor()

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [editingVendor, setEditingVendor] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Open edit modal
  const openEditModal = (vendor) => {
    setEditingVendor(vendor)
    setIsModalOpen(true)
  }

  // Handle save from modal
  const handleSaveVendor = async (updatedVendor) => {
    try {
      await updateVendor.mutateAsync({ id: updatedVendor._id, payload: updatedVendor })
      toast.success(`${updatedVendor.companyName} updated successfully!`)
      setIsModalOpen(false)      // ✅ Close modal on success
      setEditingVendor(null)     // ✅ Reset editing state
    } catch (err) {
      toast.error("Failed to update vendor.")
    }
  }

  const columns = useMemo(
    () => [
      { accessorKey: "companyName", header: "Company Name" },
      { accessorKey: "category", header: "Category" },
      { accessorKey: "contactPerson", header: "Contact Person" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status")
          const color = status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{status}</span>
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString("en-KE"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const vendor = row.original
          const handleDelete = async () => {
            try {
              await deleteVendor.mutateAsync(vendor._id)
              toast.success(`${vendor.companyName} deleted successfully!`)
            } catch {
              toast.error("Failed to delete vendor.")
            }
          }
          return (
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => openEditModal(vendor)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <span className="font-semibold">{vendor.companyName}</span>? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Confirm</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        },
      },
    ],
    [deleteVendor]
  )

  const table = useReactTable({
    data: vendors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
  })

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading vendors...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">Error loading vendors. Please try again.</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Input placeholder="Search vendors..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm" />
        <Button onClick={() => navigate({ to: "/projects/$projectId/Vendors/new" })} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No vendors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} vendors
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Vendor Modal */}
      <VendorModal
        vendor={editingVendor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVendor}
        isSaving={updateVendor.isLoading}
      />
    </div>
  )
}
