
import { useState, useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,

} from "@tanstack/react-table"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Eye, Edit, Trash, MoreHorizontal, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useDeletePO, usePos } from "@/lib/hooks/usePurchaseOrders"
import { approvePO, rejectPO } from "@/lib/api/purchaseOrders"

// ✅ helpers
const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString() : "-"
const formatAmount = (value?: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
const getStatusVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "paid":
      return "success"
    case "pending":
      return "warning"
    case "rejected":
      return "destructive"
    default:
      return "secondary"
  }
}

export default function PurchaseOrderTable() {
  const { data: pos = [], isLoading } = usePos()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { mutate: deletePurchaseOrder, isLoading: isDeleting } = useMutation({
    mutationFn: useDeletePO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos"] })
      toast.success("Purchase order deleted")
    },
    onError: () => toast.error("Failed to delete purchase order"),
  })

  const { mutate: approvePurchaseOrder } = useMutation({
    mutationFn: approvePO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos"] })
      toast.success("Purchase order approved")
    },
    onError: () => toast.error("Failed to approve purchase order"),
  })

  const { mutate: rejectPurchaseOrder } = useMutation({
    mutationFn: rejectPO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos"] })
      toast.info("Purchase order rejected")
    },
    onError: () => toast.error("Failed to reject purchase order"),
  })

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState("newest")

  const filteredPos = useMemo(() => {
    let filtered = [...pos]
    if (search.trim()) {
      const s = search.toLowerCase()
      filtered = filtered.filter(
        (po) =>
          po.vendorName?.toLowerCase().includes(s) ||
          po.poNumber?.toLowerCase().includes(s) ||
          po.reference?.toLowerCase().includes(s)
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((po) => po.status?.toLowerCase() === statusFilter)
    }
    if (sort === "newest") {
      filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date))
    } else if (sort === "oldest") {
      filtered.sort((a, b) => +new Date(a.date) - +new Date(b.date))
    } else if (sort === "amount-high") {
      filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0))
    } else if (sort === "amount-low") {
      filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0))
    }
    return filtered
  }, [pos, search, statusFilter, sort])

  const columns: ColumnDef<any>[] = [
    { header: "#", cell: ({ row }) => row.index + 1 },
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: "poNumber", header: "Purchase Number", cell: ({ row }) => <span className="font-medium">{row.original.poNumber}</span> },
    { accessorKey: "reference", header: "Reference" },
    { accessorKey: "vendorName", header: "Vendor" },
    { accessorKey: "deliveryDate", header: "Delivery Date", cell: ({ row }) => formatDate(row.original.deliveryDate) },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>,
    },
    { accessorKey: "company", header: "Company" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatAmount(row.original.amount) },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const po = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()} // ⛔ prevent row navigation
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={`${po._id}`}><Eye className="mr-2 h-4 w-4" />View</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`edit/${po._id}`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* ✅ Approve */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem disabled={po.status === "Approved"} onSelect={(e) => e.preventDefault()}>
                    Approve
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Purchase?</AlertDialogTitle>
                    <AlertDialogDescription>This will mark the PO as <strong>Approved</strong>.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => approvePurchaseOrder(po._id)}>Approve</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* ❌ Reject */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem disabled={po.status === "Rejected"} onSelect={(e) => e.preventDefault()}>
                    Reject
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Purchase</AlertDialogTitle>
                    <AlertDialogDescription>This will mark the PO as <strong>Rejected</strong>.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => rejectPurchaseOrder(po._id)}>
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DropdownMenuSeparator />

              {/* 🗑 Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Purchase?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => deletePurchaseOrder(po._id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredPos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center p-10"><p className="text-muted-foreground">Loading purchase orders...</p></div>
  }

  return (
    <div className="space-y-4">
      {/* 🔍 Filters */}
      <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="amount-high">Highest Amount</SelectItem>
              <SelectItem value="amount-low">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 📄 Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="bg-blue-300 font-bold text-black">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`${row.original._id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4 text-gray-500">
                  No Purchase Orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Pagination */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Rows:</span>
          <Select value={String(table.getState().pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              {[5, 10, 20, 50].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <Button key={i} size="sm" variant={table.getState().pagination.pageIndex === i ? "default" : "outline"} onClick={() => table.setPageIndex(i)}>{i + 1}</Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  )
}
