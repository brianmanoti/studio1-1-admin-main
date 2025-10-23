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
import { Upload, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react"
import { ImportExcelModal } from "./import-excel-modal"
import axiosInstance from "@/lib/axios"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// --- Interfaces ---
interface EstimateData {
  projectId: string
  name: string
  description?: string
  notes?: string
  date?: string
  status?: string
  groups: Group[]
  totals?: TotalLine[] // ✅ NEW (for global Excel totals)
}

interface TotalLine {
  description: string
  amount: number
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
  totals?: TotalLine[] // ✅ NEW (for group-level “TOTAL” rows)
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
  subsections?: Subsection[]
}

interface Subsection {
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

  // Top-level fields
  const [estimateName, setEstimateName] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Draft")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])

  // Utility
  const formatKES = (value: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value || 0)

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: EstimateData) => {
      const res = await axiosInstance.post("/api/estimates", data)
      return res.data
    },
    onSuccess: () => toast.success("Estimate saved successfully!"),
    onError: () => toast.error("Failed to save estimate"),
  })

  // --- Handle Excel Import ---
  const handleImportSuccess = (data: any) => {
    const importedGroups = Array.isArray(data) ? data : data.groups || []

    const mergedGroups: Record<string, Group> = {}

    importedGroups.forEach((g: any) => {
      const groupKey = g.id || g.grpId || g.name
      if (!mergedGroups[groupKey]) {
        mergedGroups[groupKey] = {
          ...g,
          sections: g.sections || [],
          totals: g.totals || [], // ✅ Support Excel totals
        }
      } else {
        mergedGroups[groupKey].sections = [
          ...(mergedGroups[groupKey].sections || []),
          ...(g.sections || []),
        ]
        mergedGroups[groupKey].notes = [
          ...(mergedGroups[groupKey].notes || []),
          ...(g.notes || []),
        ]
        mergedGroups[groupKey].totals = [
          ...(mergedGroups[groupKey].totals || []),
          ...(g.totals || []),
        ]
      }
    })

    const arrangedGroups = Object.values(mergedGroups).map((group, index) => ({
      ...group,
      id: group.id || `group-${index + 1}`,
      sections: (group.sections || []).map((section: any, si: number) => ({
        ...section,
        id: section.id || `section-${index + 1}-${si + 1}`,
        subsections: (section.subsections || []).map((sub: any, subi: number) => ({
          ...sub,
          id: sub.id || `sub-${index + 1}-${si + 1}-${subi + 1}`,
        })),
      })),
    }))

    setGroups(arrangedGroups)
    setImported(true)
    toast.success("Import successful! Totals and data structured.")
  }

  // --- Add / Update / Delete ---
  const addGroup = () =>
    setGroups([
      ...groups,
      { id: `group-${Date.now()}`, name: "", quantity: 0, rate: 0, total: 0, sections: [] },
    ])

  const addSection = (groupIndex: number) => {
    const arr = [...groups]
    const target = arr[groupIndex]
    target.sections = [
      ...(target.sections || []),
      {
        id: `section-${Date.now()}`,
        name: "",
        quantity: 0,
        rate: 0,
        amount: 0,
        subsections: [],
      },
    ]
    setGroups(arr)
  }

  const addSubsection = (groupIndex: number, sectionIndex: number) => {
    const arr = [...groups]
    const targetSection = arr[groupIndex].sections?.[sectionIndex]
    if (targetSection) {
      targetSection.subsections = [
        ...(targetSection.subsections || []),
        { id: `sub-${Date.now()}`, name: "", quantity: 0, rate: 0, amount: 0 },
      ]
      setGroups(arr)
    }
  }

  const updateGroup = (i: number, updated: Group) => {
    const arr = [...groups]
    arr[i] = updated
    setGroups(arr)
  }

  const deleteGroup = (i: number) => {
    if (confirm("Delete this group?")) setGroups(groups.filter((_, idx) => idx !== i))
  }

  // --- Submit ---
  const handleSubmit = () => {
    if (!projectId) return toast.error("Select a project first")
    if (!estimateName.trim()) return toast.error("Estimate name is required")

    const cleanedGroups = groups.map(({ grpId, sections, ...group }) => ({
      ...group,
      sections: (sections || []).map(({ secId, subsections, ...section }) => ({
        ...section,
        subsections: (subsections || []).map(({ subId, ...sub }) => sub),
      })),
    }))

    const grandTotals: TotalLine[] = []
    let overallTotal = 0

    cleanedGroups.forEach((g) => {
      const groupSum =
        g.total ||
        g.sections?.reduce(
          (s, sec) => s + (sec.quantity || 0) * (sec.rate || 0),
          0
        ) ||
        0
      overallTotal += groupSum
      if (g.totals?.length) grandTotals.push(...g.totals)
    })

    const payload: EstimateData = {
      projectId,
      name: estimateName,
      description,
      status,
      date,
      notes,
      groups: cleanedGroups,
      totals: [
        ...grandTotals,
        { description: "GRAND TOTAL", amount: overallTotal },
      ],
    }

    mutation.mutate(payload)
  }

  // --- Renderers (same as before) ---
  const renderImportedTable = () => (
    <div className="overflow-x-auto rounded-lg border border-border mt-6">
      <table className="w-full text-sm border-collapse text-center">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th></th>
            <th>Code</th>
            <th>Name</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Rate</th>
            <th>Amount</th>
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
                  <td>{g.sections?.length ? (isOpen ? <ChevronDown className="w-4 h-4 inline" /> : <ChevronRight className="w-4 h-4 inline" />) : "–"}</td>
                  <td>{g.code || "—"}</td>
                  <td className="font-semibold">{g.name}</td>
                  <td>{g.description || "—"}</td>
                  <td className="text-right">{g.quantity || 0}</td>
                  <td>{g.unit || "—"}</td>
                  <td className="text-right">{formatKES(g.rate)}</td>
                  <td className="text-right font-semibold">
                    {formatKES(g.total || g.rate * (g.quantity || 0))}
                  </td>
                </tr>

                {isOpen &&
                  g.sections?.map((s) => (
                    <>
                      <tr key={s.id} className="bg-muted/20">
                        <td></td>
                        <td>{s.code || "—"}</td>
                        <td className="pl-6">↳ {s.name}</td>
                        <td>{s.description || "—"}</td>
                        <td className="text-right">{s.quantity || 0}</td>
                        <td>{s.unit || "—"}</td>
                        <td className="text-right">{formatKES(s.rate)}</td>
                        <td className="text-right">
                          {formatKES(s.amount || s.rate * (s.quantity || 0))}
                        </td>
                      </tr>

                      {s.subsections?.map((sub) => (
                        <tr key={sub.id} className="bg-muted/10">
                          <td></td>
                          <td>{sub.code || "—"}</td>
                          <td className="pl-10 text-sm">↳ {sub.name}</td>
                          <td>{sub.description || "—"}</td>
                          <td className="text-right">{sub.quantity || 0}</td>
                          <td>{sub.unit || "—"}</td>
                          <td className="text-right">{formatKES(sub.rate)}</td>
                          <td className="text-right">
                            {formatKES(sub.amount || sub.rate * (sub.quantity || 0))}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}

                {/* ✅ Render Excel totals under each group */}
                {g.totals?.length > 0 && (
                  <>
                    {g.totals.map((t, ti) => (
                      <tr key={`total-${g.id}-${ti}`} className="bg-muted/30 font-semibold">
                        <td colSpan={7} className="text-right pr-2 italic">
                          {t.description}
                        </td>
                        <td className="text-right">{formatKES(t.amount)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Create Estimate</h2>

    {/* Top fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="flex flex-col space-y-2">
        <Label>Project</Label>
        <Select onValueChange={setProjectId}>
          <SelectTrigger>
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
      </div>

      <div className="flex flex-col space-y-2">
        <Label>Estimate Name</Label>
        <Input placeholder="Estimate Name" value={estimateName} onChange={(e) => setEstimateName(e.target.value)} />
      </div>

      <div className="flex flex-col space-y-2 md:col-span-2 lg:col-span-3">
        <Label>Description</Label>
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex flex-col space-y-2 md:col-span-2 lg:col-span-3">
        <Label>Notes</Label>
        <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex flex-col space-y-2">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="flex flex-col space-y-2">
        <Label>Status</Label>
        <Select onValueChange={setStatus} defaultValue={status}>
          <SelectTrigger>
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 text-sm">
          <Upload className="w-4 h-4" /> Import Excel
        </Button>

        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      </div>

      <div className="space-y-6 border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{imported ? "Imported Estimate Data" : "Manual Entry"}</h3>
          {!imported && (
            <Button onClick={addGroup} className="text-sm">
              + Add Group
            </Button>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm italic text-center">
            No groups yet. Start by adding or importing.
          </p>
        ) : (
          renderImportedTable()
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
