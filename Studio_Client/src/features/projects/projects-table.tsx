import * as React from "react"
import { useMemo, useState } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronUp, ChevronDown, Eye, Pencil, Trash2, MoreVertical, Plus } from "lucide-react"
import { toast } from "react-toastify"
import { useDeleteProject, useProjects } from "@/lib/hooks/useProjects"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
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
import ProjectsEmpty from "./projects-empty"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

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
  status?: "active" | "completed" | "on-hold"
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const { data: projects = [], isLoading, isError } = useProjects()
  const deleteMutation = useDeleteProject()

  // UI state
  const [search, setSearch] = useState("")
  const [projectType, setProjectType] = useState<string | undefined>()
  const [projectStatus, setProjectStatus] = useState<string | undefined>()
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // Confirm dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null)

  // ✅ Filtered list (handles empty, undefined, or partial data safely)
  const filteredProjects = useMemo(() => {
    if (!projects || projects.length === 0) return []
    const s = search.trim().toLowerCase()
    return projects.filter((p) => {
      const name = p?.name?.toLowerCase() || ""
      const companyName = p?.client?.companyName?.toLowerCase() || ""
      const matchesSearch = !s || name.includes(s) || companyName.includes(s)
      const matchesType = projectType ? p?.type === projectType : true
      const matchesStatus = projectStatus ? p?.status === projectStatus : true
      return matchesSearch && matchesType && matchesStatus
    })
  }, [projects, search, projectType, projectStatus])

  // ✅ Status badge component
  const StatusBadge = ({ status }: { status?: string }) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const },
      completed: { label: "Completed", variant: "secondary" as const },
      "on-hold": { label: "On Hold", variant: "outline" as const },
    }

    const config = status ? statusConfig[status as keyof typeof statusConfig] : statusConfig.active

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // ✅ Columns definition
  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      header: "Project ID",
      accessorKey: "projectNumber",
      cell: (info) => (
        <span className="text-xs font-mono font-medium text-muted-foreground">
          {info.getValue() || "N/A"}
        </span>
      ),
      size: 120,
    },
    {
      header: "Project Name",
      accessorKey: "name",
      cell: (info) => {
        const project = info.row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {project.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                {project.name || "Unnamed Project"}
              </span>
              <StatusBadge status={project.status} />
            </div>
          </div>
        )
      },
      size: 200,
    },
    {
      header: "Client",
      accessorKey: "client.companyName",
      cell: (info) => {
        const project = info.row.original
        const client = project?.client
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {client?.primaryContact?.charAt(0)?.toUpperCase() || client?.companyName?.charAt(0)?.toUpperCase() || "?"}
            </div>
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
      size: 220,
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (info) => {
        const type = info.getValue() as string
        return type ? (
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      },
      size: 120,
    },
    {
      header: "Timeline",
      id: "timeline",
      cell: (info) => {
        const project = info.row.original
        const formatDate = (dateString?: string) => {
          if (!dateString) return "-"
          return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        }

        return (
          <div className="flex flex-col text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium">{formatDate(project.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">End:</span>
              <span className="font-medium">{formatDate(project.endDate)}</span>
            </div>
          </div>
        )
      },
      size: 150,
    },
    {
      header: "Actions",
      id: "actions",
      cell: (info) => {
        const project = info.row.original
        return (
          <div className="flex items-center justify-end gap-1">
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ to: `/projects/${project._id}` })
                }}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ to: `/projects/${project._id}/edit` })
                }}
                className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600"
                title="Edit project"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Delete project"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedProject({ id: project._id, name: project.name })
                  setOpenDialog(true)
                }}
                disabled={deleteMutation.isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({ to: `/projects/${project._id}` })
                  }}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" /> 
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({ to: `/projects/${project._id}/edit` })
                  }}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" /> 
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProject({ id: project._id, name: project.name })
                    setOpenDialog(true)
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                  disabled={deleteMutation.isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      size: 120,
    },
  ], [navigate, deleteMutation.isLoading])

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
  if (isLoading) return (
    <section className="p-6">
      <ProjectListSkeleton />
    </section>
  )
  
  if (isError) return (
    <section className="p-6">
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Failed to load projects</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try refreshing the page or check your connection.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )

  if (!projects?.length && !isLoading) return <ProjectsEmpty />

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
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Project Management</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Manage and track all your active projects and assignments
              </p>
            </div>

            <Link to="/projects/new">
              <Button className="bg-primary hover:bg-primary/90 shadow-sm gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Filters Card */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects or clients..."
                    className="pl-10 h-10 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <Select
                    value={projectType ?? "all"}
                    onValueChange={(value) => setProjectType(value === "all" ? undefined : value)}
                  >
                    <SelectTrigger className="w-full sm:flex-1 h-10 text-sm">
                      <SelectValue placeholder="Project Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="new">New Home</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={projectStatus ?? "all"}
                    onValueChange={(value) => setProjectStatus(value === "all" ? undefined : value)}
                  >
                    <SelectTrigger className="w-full sm:flex-1 h-10 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </span>
              {(search || projectType || projectStatus) && (
                <Badge variant="secondary" className="text-xs">
                  Filtered
                </Badge>
              )}
            </div>
          </div>

          {/* Table Card */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:bg-muted/80 transition-colors"
                          style={{ width: header.getSize() }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1.5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && <ChevronUp className="w-4 h-4" />}
                            {header.column.getIsSorted() === "desc" && <ChevronDown className="w-4 h-4" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate({ to: `/projects/${row.original._id}` })}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state for filtered results */}
            {filteredProjects.length === 0 && projects.length > 0 && (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearch("")
                    setProjectType(undefined)
                    setProjectStatus(undefined)
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </Card>

          {/* Pagination */}
          {table.getPageCount() > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-9"
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{" "}
                  <span className="font-medium">{table.getPageCount()}</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-9"
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(value) =>
                    setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: Number(value) }))
                  }
                >
                  <SelectTrigger className="w-20 h-9">
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
          )}
        </div>

        {/* Confirm Delete Dialog */}
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
                Are you sure you want to delete the project <strong>"{selectedProject.name}"</strong>? 
                This action cannot be undone and all project data will be permanently removed.
              </>
            }
            confirmText="Delete Project"
            cancelBtnText="Cancel"
            destructive
            handleConfirm={() => {
              deleteMutation.mutate(selectedProject.id, {
                onSuccess: () => {
                  toast.success("Project deleted successfully")
                  setOpenDialog(false)
                  setSelectedProject(null)
                },
                onError: (error) => {
                  toast.error("Failed to delete project")
                  console.error("Delete project error:", error)
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