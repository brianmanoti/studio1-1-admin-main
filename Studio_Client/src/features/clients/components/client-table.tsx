import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit2, Trash2, Plus } from "lucide-react"

import axiosInstance from "@/lib/axios"
import { ClientModals } from "./client-modals"
import { CreateClientForm } from "./create-client-form"

export function ClientsTable() {
  const queryClient = useQueryClient()
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedClient, setSelectedClient] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Fetch clients
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/clients")
      return res.data.data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients"])
      setModalType(null)
      setSelectedClient(null)
    },
  })

  const handleView = (client) => {
    setSelectedClient(client)
    setModalType("view")
  }

  const handleEdit = (client) => {
    setSelectedClient(client)
    setModalType("edit")
  }

  const handleDelete = (client) => {
    setSelectedClient(client)
    setModalType("delete")
  }

  const confirmDelete = () => {
    if (selectedClient) deleteMutation.mutate(selectedClient._id)
  }

  // Table Columns
  const columns = useMemo(
    () => [
      { accessorKey: "clientId", header: "Client ID" },
      { accessorKey: "companyName", header: "Company" },
      { accessorKey: "primaryContact", header: "Contact" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "city", header: "City" },
      { accessorKey: "clientType", header: "Type" },
      {
        header: "Actions",
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleView(client)}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(client)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(client)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: clients,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) return <div className="text-center py-8">Loading clients...</div>
  if (error) return <div className="text-red-600 text-center py-8">Failed to load clients</div>

  return (
    <>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
        <input
          placeholder="Search..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg w-full md:w-1/3 outline-blue-500"
        />

        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Client
        </Button>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border w-full overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-blue-50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-blue-700 font-semibold">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-blue-50 transition">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6 text-gray-500">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-gray-700">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="border-blue-500 text-blue-600"
          >
            Previous
          </Button>

          <Button
            variant="outline"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="border-blue-500 text-blue-600"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modals */}
      {selectedClient && (
        <ClientModals
          client={selectedClient}
          modalType={modalType}
          onClose={() => {
            setModalType(null)
            setSelectedClient(null)
          }}
          onConfirmDelete={confirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <CreateClientForm open={showCreateForm} onClose={() => setShowCreateForm(false)} />
    </>
  )
}
