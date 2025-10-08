"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { ImportExcelModal } from "./import-excel-modal"
import axiosInstance from "@/lib/axios"

interface EstimateData {
  projectId: string
  groups: Group[]
}

interface Group {
  id?: string
  code?: string
  name: string
  description?: string
  quantity: number
  unit?: string
  rate: number
  amount?: number
  total: number
  sections?: Section[]
}

interface Section {
  id?: string
  code?: string
  name: string
  description?: string
  quantity: number
  unit?: string
  rate: number
  amount?: number
}

export default function EstimateForm() {
  const [projectId, setProjectId] = useState<string>("")
  const [groups, setGroups] = useState<Group[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [imported, setImported] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // ✅ Format currency (Kenya Shilling)
  const formatKES = (value: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value || 0)

  // ✅ Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

// ✅ Save Estimate (using axiosInstance)
const mutation = useMutation({
  mutationFn: async (data: EstimateData) => {
    const res = await axiosInstance.post("/api/estimates", data)
    return res.data
  },
  onSuccess: () => toast.success("Estimate saved successfully!"),
  onError: () => toast.error("Failed to save estimate"),
})

  // ✅ Handle Import Success
  const handleImportSuccess = (data: any) => {
    const importedGroups = Array.isArray(data) ? data : data.groups || []
    setGroups(importedGroups)
    setImported(true)
    toast.success("Import successful! Data populated.")
  }

  const addGroup = () =>
    setGroups([
      ...groups,
      { name: "", quantity: 0, rate: 0, total: 0, sections: [] },
    ])

  const updateGroup = (i: number, updated: Group) => {
    const arr = [...groups]
    arr[i] = updated
    setGroups(arr)
  }

  const deleteGroup = (i: number) => {
    if (confirm("Delete this group?")) {
      setGroups(groups.filter((_, idx) => idx !== i))
    }
  }

  const handleSubmit = () => {
    if (!projectId) return toast.error("Select a project first")
    mutation.mutate({ projectId, groups })
  }

  // ✅ Collapsible Imported Table (Groups → Sections)
  const renderImportedTable = () => (
    <div className="overflow-x-auto rounded-lg border border-border mt-6">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2 border-b w-8"></th>
            <th className="px-4 py-2 border-b">Code</th>
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Description</th>
            <th className="px-4 py-2 border-b text-right">Quantity</th>
            <th className="px-4 py-2 border-b">Unit</th>
            <th className="px-4 py-2 border-b text-right">Rate</th>
            <th className="px-4 py-2 border-b text-right">Amount</th>
          </tr>
        </thead>

        <tbody>
          {groups.map((g) => {
            const isOpen = expanded[g.id || g.name]
            return (
              <>
                <tr
                  key={g.id || g.name}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [g.id || g.name]: !prev[g.id || g.name],
                    }))
                  }
                >
                  <td className="px-2 py-2 border-b text-center">
                    {g.sections && g.sections.length > 0 ? (
                      isOpen ? (
                        <ChevronDown className="w-4 h-4 inline" />
                      ) : (
                        <ChevronRight className="w-4 h-4 inline" />
                      )
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border-b">{g.code || "—"}</td>
                  <td className="px-4 py-2 border-b font-medium">{g.name}</td>
                  <td className="px-4 py-2 border-b">{g.description || "—"}</td>
                  <td className="px-4 py-2 border-b text-right">
                    {g.quantity || 0}
                  </td>
                  <td className="px-4 py-2 border-b">{g.unit || "—"}</td>
                  <td className="px-4 py-2 border-b text-right">
                    {formatKES(g.rate)}
                  </td>
                  <td className="px-4 py-2 border-b text-right font-semibold">
                    {formatKES(
                      g.amount || g.rate * (g.quantity || 0)
                    )}
                  </td>
                </tr>

                {/* Collapsible section rows */}
                {isOpen &&
                  g.sections?.map((s) => (
                    <tr
                      key={s.id || s.name}
                      className="bg-muted/20 transition-all duration-300"
                    >
                      <td></td>
                      <td className="px-4 py-2 border-b text-muted-foreground">
                        {s.code || "—"}
                      </td>
                      <td className="px-4 py-2 border-b pl-8">
                        ↳ {s.name}
                      </td>
                      <td className="px-4 py-2 border-b">{s.description || "—"}</td>
                      <td className="px-4 py-2 border-b text-right">
                        {s.quantity || 0}
                      </td>
                      <td className="px-4 py-2 border-b">{s.unit || "—"}</td>
                      <td className="px-4 py-2 border-b text-right">
                        {formatKES(s.rate)}
                      </td>
                      <td className="px-4 py-2 border-b text-right">
                        {formatKES(s.amount || s.rate * (s.quantity || 0))}
                      </td>
                    </tr>
                  ))}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  // ✅ Manual Form (unchanged)
  const renderManualForm = () => (
    <div className="space-y-4 mt-6">
      {groups.map((group, i) => (
        <div
          key={i}
          className="border rounded-lg p-4 space-y-4 bg-muted/40 shadow-sm"
        >
          <div className="grid grid-cols-5 gap-2 items-center">
            <Input
              placeholder="Group Name"
              value={group.name}
              onChange={(e) =>
                updateGroup(i, { ...group, name: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Qty"
              value={group.quantity}
              onChange={(e) =>
                updateGroup(i, {
                  ...group,
                  quantity: +e.target.value,
                  total: +e.target.value * group.rate,
                })
              }
            />
            <Input
              type="number"
              placeholder="Rate"
              value={group.rate}
              onChange={(e) =>
                updateGroup(i, {
                  ...group,
                  rate: +e.target.value,
                  total: +e.target.value * group.quantity,
                })
              }
            />
            <Input disabled value={group.total} />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteGroup(i)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Create Estimate</h2>

      {/* Project Selector + Import */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <Select onValueChange={setProjectId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p: any) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="flex items-center gap-2 text-sm"
          onClick={() => setIsImportModalOpen(true)}
        >
          <Upload className="w-4 h-4" />
          Import Excel
        </Button>

        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      </div>

      {/* Table or manual UI */}
      <div className="space-y-6 border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {imported ? "Imported Estimate Data" : "Manual Entry"}
          </h3>
          {!imported && <Button onClick={addGroup}>+ Add Group</Button>}
        </div>

        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm italic text-center">
            No groups yet. Start by adding or importing.
          </p>
        ) : imported ? (
          renderImportedTable()
        ) : (
          renderManualForm()
        )}

        <Button
          onClick={handleSubmit}
          disabled={!projectId || mutation.isPending}
          className="w-full mt-4"
        >
          {mutation.isPending ? "Saving..." : "Save Estimate"}
        </Button>
      </div>
    </div>
  )
}
