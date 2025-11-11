"use client"

import { useState, useMemo } from "react"
import { useVendors, useUpdateVendor, useDeleteVendor, Vendor } from "@/hooks/use-vendors"
import VendorModal from "./VendorModal"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender
} from "@tanstack/react-table"
import { useNavigate } from "@tanstack/react-router"

export function VendorsTable() {
  const navigate = useNavigate()
  const { data: vendors = [], isLoading, error } = useVendors()
  const deleteVendor = useDeleteVendor()
  const updateVendor = useUpdateVendor()

  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setIsModalOpen(true)
  }

  const handleSaveVendor = async (vendorData: Vendor) => {
    if (!vendorData._id) return

    try {
      await updateVendor.mutateAsync({ id: vendorData._id, data: vendorData })
      toast.success(`${vendorData.companyName} updated successfully!`)
      setIsModalOpen(false)
      setEditingVendor(null)
    } catch (err) {
      toast.error("Failed to update vendor.")
    }
  }

  const handleDeleteVendor = async (vendor: Vendor) => {
    try {
      await deleteVendor.mutateAsync(vendor._id)
      toast.success(`${vendor.companyName} deleted successfully!`)
    } catch (err) {
      toast.error("Failed to delete vendor.")
    }
  }

  const columns = useMemo(() => [
    { accessorKey: "companyName", header: "Company Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "contactPerson", header: "Contact Person" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium ${
            row.getValue("status") === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.getValue("status")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const vendor = row.original
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => openEditModal(vendor)}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDeleteVendor(vendor)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        )
      },
    },
  ], [])

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

  if (isLoading) return <div className="py-20 text-center text-gray-500">Loading vendors...</div>
  if (error) return <div className="py-20 text-center text-red-500">Failed to load vendors</div>

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <Input
          placeholder="Search vendors..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <Button
          className="flex items-center gap-2"
          onClick={() =>
            navigate({ to: "/projects/$projectId/vendors/new", params: { projectId: "123" } })
          }
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  No vendors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} vendors
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
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
