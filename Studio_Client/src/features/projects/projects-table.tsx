import * as React from "react"
import { useMemo, useState } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronUp, ChevronDown, Eye, Pencil, Trash2, MoreVertical, Plus, AlertCircle, Calendar, Users, FolderOpen } from "lucide-react"
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
import ProjectsEmpty from "./projects-empty"

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
  status?: string
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const { data: projects = [], isLoading, isError, error } = useProjects()
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

  // Error state for delete operations
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  // ✅ Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const total = projects.length
    const active = projects.filter(p => p.status === 'active' || !p.status).length
    const completed = projects.filter(p => p.status === 'completed').length
    const upcoming = projects.filter(p => {
      if (!p.startDate) return false
      const startDate = new Date(p.startDate)
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      return startDate > now && startDate <= nextMonth
    }).length

    return { total, active, completed, upcoming }
  }, [projects])

  // ✅ Get status badge color
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'on-hold': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  // ✅ Columns definition
  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      header: "ID",
      accessorKey: "projectNumber",
      cell: (info) => (
        <span className="text-xs font-medium text-muted-foreground font-mono">
          {info.getValue() || "N/A"}
        </span>
      ),
    },
    {
      header: "Project Name",
      accessorKey: "name",
      cell: (info) => {
        const project = info.row.original
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {project.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors">
                {project.name || "Unnamed Project"}
              </span>
              {project.status && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 w-fit ${getStatusColor(project.status)}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              )}
            </div>
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
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              {client?.primaryContact?.charAt(0)?.toUpperCase() || client?.companyName?.charAt(0)?.toUpperCase() || "?"}
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
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {type}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      },
    },
    {
      header: "Timeline",
      accessorKey: "startDate",
      cell: (info) => {
        const project = info.row.original
        const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'
        const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'
        
        return (
          <div className="flex flex-col text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{startDate}</span>
            </div>
            {endDate !== '-' && (
              <div className="text-muted-foreground mt-1">→ {endDate}</div>
            )}
          </div>
        )
      },
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
              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Edit */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: `/projects/${project._id}/edit` })
              }}
              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
              title="Edit project"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
              title="Delete project"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedProject({ id: project._id, name: project.name })
                setDeleteError(null)
                setOpenDialog(true)
              }}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

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
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({ to: `/projects/${project._id}/edit` })
                  }}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" /> Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProject({ id: project._id, name: project.name })
                    setDeleteError(null)
                    setOpenDialog(true)
                  }}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  disabled={deleteMutation.isLoading}
                >
                  <Trash2 className="h-4 w-4" /> Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
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

  // ✅ Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!selectedProject) return

    deleteMutation.mutate(selectedProject.id, {
      onSuccess: () => {
        setOpenDialog(false)
        setSelectedProject(null)
        setDeleteError(null)
      },
      onError: (error: any) => {
        setDeleteError(
          error?.response?.data?.message || 
          error?.message || 
          "Failed to delete project. Please try again."
        )
      },
    })
  }

  // ✅ Loading state
  if (isLoading) {
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
          <div className="p-6">
            <ProjectListSkeleton />
          </div>
        </Main>
      </>
    )
  }

  // ✅ Error state
  if (isError) {
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
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                    Failed to Load Projects
                  </h3>
                  <p className="text-red-700 dark:text-red-400 mt-1">
                    {error?.message || "There was an error loading your projects. Please try again."}
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Main>
      </>
    )
  }

  // ✅ Empty state
  if (!projects?.length && !isLoading) {
    return <ProjectsEmpty />
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Project Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track all your projects in one place
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/projects/new">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.active}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.completed}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.upcoming}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800/50 p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects or clients..."
                  className="pl-10 h-10 text-sm border-blue-200 dark:border-blue-800 focus:border-blue-300 dark:focus:border-blue-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-1 gap-3">
                <Select
                  value={projectType ?? "all"}
                  onValueChange={(value) => setProjectType(value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="h-10 text-sm border-blue-200 dark:border-blue-800 flex-1">
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
                  <SelectTrigger className="h-10 text-sm border-blue-200 dark:border-blue-800 flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-100 dark:border-blue-800/30">
              <span className="text-sm text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} projects
              </span>
              {(search || projectType || projectStatus) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("")
                    setProjectType(undefined)
                    setProjectStatus(undefined)
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm">
                <thead className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider cursor-pointer select-none hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
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

                <tbody className="divide-y divide-blue-100 dark:divide-blue-800/50">
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => navigate({ to: `/projects/${row.original._id}` })}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Search className="h-8 w-8" />
                          <p className="font-medium">No projects found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {table.getPageCount() > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-9 text-sm border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground mx-2">
                  Page <span className="font-medium text-blue-600 dark:text-blue-400">{table.getState().pagination.pageIndex + 1}</span> of{" "}
                  <span className="font-medium">{table.getPageCount()}</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-9 text-sm border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/10"
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
                  <SelectTrigger className="w-20 h-9 text-sm border-blue-200 dark:border-blue-800">
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
        <ConfirmDialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open)
            if (!open) {
              setSelectedProject(null)
              setDeleteError(null)
            }
          }}
          title="Delete Project"
          desc={
            <div className="space-y-3">
              <p>
                Are you sure you want to delete <strong>"{selectedProject?.name}"</strong>? 
                This action cannot be undone.
              </p>
              {deleteError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  {deleteError}
                </div>
              )}
            </div>
          }
          confirmText={deleteMutation.isLoading ? "Deleting..." : "Delete Project"}
          cancelBtnText="Cancel"
          destructive
          handleConfirm={handleDeleteConfirm}
          isLoading={deleteMutation.isLoading}
          confirmDisabled={deleteMutation.isLoading}
        />
      </Main>
    </>
  )
}

export default ProjectList