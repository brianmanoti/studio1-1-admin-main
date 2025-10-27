"use client"

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
import { useState, useMemo } from "react"
import { useItems, useDeleteItem, useUpdateItem } from "@/hooks/use-items"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export interface Material {
  _id: string
  name: string
  description: string
  unit: string
  unitPrice: number
  createdAt: string
  updatedAt: string
}

const formatKES = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount)

export function ItemsTable() {
  const { data: items = [], isLoading, error } = useItems()
  const deleteItem = useDeleteItem()
  const updateItem = useUpdateItem()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = useMemo<ColumnDef<Material>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold text-gray-800"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-sm text-gray-600 max-w-xs truncate">{row.getValue("description")}</div>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => <div className="text-center text-gray-700">{row.getValue("unit")}</div>,
      },
      {
        accessorKey: "unitPrice",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold text-gray-800"
          >
            Unit Price (KES)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const price = Number(row.getValue("unitPrice"))
          return <div className="font-semibold text-gray-900">{formatKES(price)}</div>
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"))
          return <div className="text-sm text-gray-600">{date.toLocaleDateString("en-KE")}</div>
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const material = row.original

          const handleDelete = async () => {
            try {
              await deleteItem.mutateAsync(material._id)
              toast.success(`${material.name} deleted successfully!`)
            } catch (err: any) {
              toast.error(err?.response?.data?.message || "Failed to delete item.")
            }
          }

          const handleEdit = async () => {
            try {
              const updated = {
                ...material,
                name: material.name + " (Updated)",
              }
              await updateItem.mutateAsync({ id: material._id, payload: updated })
              toast.success(`${material.name} updated successfully!`)
            } catch (err: any) {
              toast.error("Failed to update item.")
            }
          }

          return (
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={handleEdit}>
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
                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{" "}
                      <span className="font-semibold">{material.name}</span>? This action cannot be undone.
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
    [deleteItem, updateItem]
  )

  const table = useReactTable({
    data: items,
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

  if (isLoading)
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading items...</div>

  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Error loading items. Please try again.
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Input
          placeholder="Search items..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => toast.info("Add Item clicked")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-gray-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Showing{" "}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} items
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
