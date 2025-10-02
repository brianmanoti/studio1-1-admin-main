"use client";

import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { useProjects } from "@/lib/hooks/useProjects";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Main } from "@/components/layout/main";

interface Project {
  _id: string;
  projectNumber?: string;
  name: string;
  client?: {
    companyName?: string;
    primaryContact?: string;
    email?: string;
  };
  type?: string;
  startDate?: string;
  endDate?: string;
}

const ProjectList = () => {
  const { data: projects = [], isLoading, isError } = useProjects();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState<string | undefined>();
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const notify = () => toast("Project created");

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = projectType ? p.type === projectType : true;
        return matchesSearch && matchesType;
      }),
    [projects, search, projectType]
  );

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      { header: "ID", accessorKey: "projectNumber", cell: (info) => info.getValue() || "N/A" },
      {
        header: "Name",
        accessorKey: "name",
        cell: (info) => {
          const project = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-200 text-xs font-semibold">
                {project.name?.charAt(0).toUpperCase()}
              </span>
              <span className="text-blue-700 font-medium hover:underline">{project.name}</span>
            </div>
          );
        },
      },
      {
        header: "Client",
        accessorKey: "client.companyName",
        cell: (info) => {
          const project = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                {project.client?.primaryContact?.charAt(0).toUpperCase() || "?"}
              </span>
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium">{project.client?.companyName || "Unknown Client"}</span>
                <span className="text-xs text-gray-500">
                  {project.client?.primaryContact || ""} {project.client?.email ? `· ${project.client.email}` : ""}
                </span>
              </div>
            </div>
          );
        },
      },
      { header: "Project Type", accessorKey: "type", cell: (info) => info.getValue() || "-" },
      { header: "Start Date", accessorKey: "startDate" },
      { header: "End Date", accessorKey: "endDate" },
    ],
    []
  );

  const table = useReactTable({
    data: filteredProjects,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
  });

  if (isLoading) return <p>Loading projects...</p>;
  if (isError) return <p>Failed to load projects</p>;
  if (!projects.length) return <p className="text-gray-500">No projects found. Start by creating one!</p>;

  return (
    <>
          <Header>
            <div className='ms-auto flex items-center space-x-4'>
              
              <ThemeSwitch />
              <ConfigDrawer />
              <ProfileDropdown />
            </div>
          </Header>
          <Main>
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Active Projects</h2>
                <div className="flex items-center gap-3">
                  <Button onClick={notify}>Notify</Button>
                  <Link to="/projects/new">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                      + Create Project
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search projects..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <Select onValueChange={(value) => setProjectType(value === "all" ? undefined : value)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Project Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New Home</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
            <div className="overflow-x-auto overflow-y-auto rounded-lg border shadow-sm">
              <table className="min-w-[800px] w-full text-sm">
                <thead className="bg-gray-100">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="text-left text-gray-700 font-medium">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="p-4 cursor-pointer select-none">
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronUp className="w-3 h-3" />,
                              desc: <ChevronDown className="w-3 h-3" />,
                            }[header.column.getIsSorted() as string] || null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate({ to: `/projects/${row.original._id}` })}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              {/* Pagination Footer */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    {"<"}
                  </Button>
                  <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    {">"}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>Items per page</span>
                </div>
              </div>
            </div>
          </Main>
    </>
  );
};

export default ProjectList;
