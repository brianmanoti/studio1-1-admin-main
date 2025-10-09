import * as React from "react"
import { useMemo, useState } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronUp, ChevronDown, Eye, Pencil, Trash2, MoreVertical } from "lucide-react"
import { toast } from "react-toastify"
import { useDeleteProject, useProjects } from "@/lib/hooks/useProjects"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table"
import { Header } from "@/components/layout/header"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Main } from "@/components/layout/main"
import { ProjectListSkeleton } from "./components/projects-skeleton"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface Project {
  _id: string
  projectNumber?: string
  name: string
  client?: {
    companyName?: string
    primaryContact?: string
    email?: string
  }
  type?: string
  startDate?: string
  endDate?: string
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const { data: projects = [], isLoading, isError } = useProjects()
  const deleteMutation = useDeleteProject()

  // UI state
  const [search, setSearch] = useState("")
  const [projectType, setProjectType] = useState<string | undefined>()
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // Confirm dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null)

  const notify = () => toast("Project created")

  // ✅ Filtered list (handles empty, undefined, or partial data safely)
  const filteredProjects = useMemo(() => {
    if (!projects || projects.length === 0) return []
    const s = search.trim().toLowerCase()
    return projects.filter((p) => {
      const name = p?.name?.toLowerCase() || ""
      const matchesSearch = !s || name.includes(s)
      const matchesType = projectType ? p?.type === projectType : true
      return matchesSearch && matchesType
    })
  }, [projects, search, projectType])

  // ✅ Columns definition
  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      header: "ID",
      accessorKey: "projectNumber",
      cell: (info) => (
        <span className="text-xs font-medium text-muted-foreground">{info.getValue() || "N/A"}</span>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: (info) => {
        const project = info.row.original
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
              {project.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
            <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {project.name || "Unnamed Project"}
            </span>
          </div>
        )
      },
    },
    {
      header: "Client",
      accessorKey: "client.companyName",
      cell: (info) => {
        const project = info.row.original
        const client = project?.client
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {client?.primaryContact?.charAt(0)?.toUpperCase() || "?"}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {client?.companyName || "Unknown Client"}
              </span>
              <span className="text-xs text-muted-foreground">
                {client?.primaryContact || ""}
                {client?.email ? ` · ${client.email}` : ""}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (info) => {
        const type = info.getValue() as string
        return type ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {type}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      },
    },
    {
      header: "Start Date",
      accessorKey: "startDate",
      cell: (info) => (
        <span className="text-xs text-muted-foreground">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "End Date",
      accessorKey: "endDate",
      cell: (info) => (
        <span className="text-xs text-muted-foreground">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: (info) => {
        const project = info.row.original
        return (
          <div className="flex items-center gap-1">
            {/* View */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: `/projects/${project._id}` })
              }}
              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
              title="View"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            {/* Edit */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: `/projects/${project._id}/edit` })
              }}
              className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-600"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedProject({ id: project._id, name: project.name })
                setOpenDialog(true)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* Mobile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({ to: `/projects/${project._id}` })
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({ to: `/projects/${project._id}/edit` })
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProject({ id: project._id, name: project.name })
                    setOpenDialog(true)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [navigate])

  // ✅ Table setup
  const table = useReactTable({
    data: filteredProjects,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // ✅ Loading / error / empty handling
  if (isLoading) return <section className="p-6 text-sm text-muted-foreground"><ProjectListSkeleton /></section>
  if (isError) return <p className="p-6 text-sm text-destructive">Failed to load projects</p>
  if (!projects?.length && !isLoading)
    return <p className="p-6 text-sm text-muted-foreground">No projects found. Start by creating one!</p>

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="p-2 md:p-4 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Active Projects</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Manage and track all your projects
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={notify} variant="outline" size="sm" className="text-xs md:text-sm bg-transparent">
                Notify
              </Button>
              <Link to="/projects/new">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs md:text-sm shadow-sm">
                  + Create Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select
              value={projectType ?? "all"}
              onValueChange={(value) => setProjectType(value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                <SelectValue placeholder="Project Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="new">New Home</SelectItem>
                <SelectItem value="renovation">Renovation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:bg-muted/80 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1.5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && <ChevronUp className="w-3 h-3" />}
                            {header.column.getIsSorted() === "desc" && <ChevronDown className="w-3 h-3" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-border bg-card">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate({ to: `/projects/${row.original._id}` })}
                      className="hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 text-xs"
              >
                Previous
              </Button>

              <span className="text-xs">
                Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{" "}
                <span className="font-medium">{table.getPageCount()}</span>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page:</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) =>
                  setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: Number(value) }))
                }
              >
                <SelectTrigger className="w-16 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Confirm Dialog */}
        {selectedProject && (
          <ConfirmDialog
            open={openDialog}
            onOpenChange={(open) => {
              setOpenDialog(open)
              if (!open) setSelectedProject(null)
            }}
            title="Delete Project"
            desc={
              <>
                Are you sure you want to delete <strong>{selectedProject.name}</strong>? This action
                cannot be undone.
              </>
            }
            confirmText="Delete"
            cancelBtnText="Cancel"
            destructive
            handleConfirm={() => {
              deleteMutation.mutate(selectedProject.id, {
                onSuccess: () => {
                  toast.success("Project deleted successfully")
                  setOpenDialog(false)
                  setSelectedProject(null)
                },
                onError: () => {
                  toast.error("Failed to delete project")
                },
              })
            }}
            isLoading={deleteMutation.isLoading}
          />
        )}
      </Main>
    </>
  )
}

export default ProjectList
