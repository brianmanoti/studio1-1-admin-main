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

interface EstimateData {
  projectId: string
  name: string
  description?: string
  notes?: string
  date?: string
  status?: string
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

  // New fields
  const [estimateName, setEstimateName] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Draft")
  const [date, setDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  )

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

const handleImportSuccess = (data: any) => {
  const importedGroups = Array.isArray(data) ? data : data.groups || [];

  // ✅ Step 1: Normalize by group id or name
  const mergedGroups: Record<string, Group> = {};

  importedGroups.forEach((g: any) => {
    const groupKey = g.id || g.grpId || g.name;

    if (!mergedGroups[groupKey]) {
      mergedGroups[groupKey] = {
        ...g,
        sections: g.sections || [],
      };
    } else {
      // ✅ Merge sections & notes if same group appears multiple times
      mergedGroups[groupKey].sections = [
        ...(mergedGroups[groupKey].sections || []),
        ...(g.sections || []),
      ];
      mergedGroups[groupKey].notes = [
        ...(mergedGroups[groupKey].notes || []),
        ...(g.notes || []),
      ];
    }
  });

  // ✅ Step 2: Convert back to array and ensure unique IDs
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
  }));

  // ✅ Step 3: Apply to state
  setGroups(arrangedGroups);
  setImported(true);
  toast.success("Import successful! Data organized and structured.");
};


  const addGroup = () =>
    setGroups([
      ...groups,
      {
        id: `group-${Date.now()}`,
        name: "",
        quantity: 0,
        rate: 0,
        total: 0,
        sections: [],
      },
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
        {
          id: `sub-${Date.now()}`,
          name: "",
          quantity: 0,
          rate: 0,
          amount: 0,
        },
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
    if (confirm("Delete this group?")) {
      setGroups(groups.filter((_, idx) => idx !== i))
    }
  }

const handleSubmit = () => {
  if (!projectId) return toast.error("Select a project first");
  if (!estimateName.trim()) return toast.error("Estimate name is required");

  // 🧹 Clean + strip backend-generated IDs (grpId, secId, subId)
  const cleanedGroups = groups.map(({ grpId, sections, ...group }) => ({
    ...group,
    sections: (sections || []).map(({ secId, subsections, ...section }) => ({
      ...section,
      subsections: (subsections || []).map(({ subId, ...sub }) => ({
        ...sub,
      })),
    })),
  }));

  const payload = {
    projectId,
    name: estimateName,
    description,
    status,
    date,
    notes,
    groups: cleanedGroups,
  };
  mutation.mutate(payload);
};



  const renderImportedTable = () => (
    <div className="overflow-x-auto rounded-lg border border-border mt-6">
      <table className="w-full text-sm border-collapse text-center [&_th]:font-semibold [&_td]:text-gray-700 [&_tr:hover]:bg-muted/30 transition-colors">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 border-b w-8 text-center align-middle"></th>
            <th className="px-3 py-2 border-b text-center align-middle">Code</th>
            <th className="px-3 py-2 border-b w-[20%] text-center align-middle">Name</th>
            <th className="px-3 py-2 border-b w-[25%] text-center align-middle">Description</th>
            <th className="px-3 py-2 border-b text-center align-middle">Qty</th>
            <th className="px-3 py-2 border-b text-center align-middle">Unit</th>
            <th className="px-3 py-2 border-b text-center align-middle">Rate</th>
            <th className="px-3 py-2 border-b text-center align-middle">Amount</th>
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
                  <td className="px-3 py-2 border-b text-center align-middle">
                    {g.sections?.length ? (
                      isOpen ? (
                        <ChevronDown className="w-4 h-4 inline" />
                      ) : (
                        <ChevronRight className="w-4 h-4 inline" />
                      )
                    ) : (
                      <span>–</span>
                    )}
                  </td>
                  <td>{g.code || "—"}</td>
                  <td className="font-semibold">{g.name}</td>
                  <td>{g.description || "—"}</td>
                  <td className="text-right">{g.quantity || 0}</td>
                  <td>{g.unit || "—"}</td>
                  <td className="text-right">{formatKES(g.rate)}</td>
                  <td className="text-right font-semibold">
                    {formatKES(g.amount || g.rate * (g.quantity || 0))}
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
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const renderManualForm = () => (
    <div className="space-y-4 mt-6">
      {groups.map((group, i) => (
        <div key={group.id} className="border rounded-lg p-4 space-y-4 bg-muted/40 shadow-sm">
          <div className="grid grid-cols-6 gap-2 items-center">
            <Input placeholder="Group Name" value={group.name} onChange={(e) => updateGroup(i, { ...group, name: e.target.value })} />
            <Input placeholder="Description" value={group.description || ""} onChange={(e) => updateGroup(i, { ...group, description: e.target.value })} />
            <Input type="number" placeholder="Qty" value={group.quantity} onChange={(e) => updateGroup(i, { ...group, quantity: +e.target.value, total: +e.target.value * group.rate })} />
            <Input type="number" placeholder="Rate" value={group.rate} onChange={(e) => updateGroup(i, { ...group, rate: +e.target.value, total: +e.target.value * group.quantity })} />
            <Input disabled value={group.total} />
            <Button size="icon" variant="ghost" onClick={() => deleteGroup(i)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addSection(i)}>
              <Plus className="w-3 h-3" /> Add Section
            </Button>
          </div>

          {group.sections?.map((section, si) => (
            <div key={section.id} className="ml-4 mt-2 border-l pl-4 space-y-2">
              <div className="grid grid-cols-6 gap-2">
                <Input placeholder="Section Name" value={section.name} onChange={(e) => {
                  const arr = [...groups]
                  arr[i].sections![si].name = e.target.value
                  setGroups(arr)
                }} />
                <Input placeholder="Description" value={section.description || ""} onChange={(e) => {
                  const arr = [...groups]
                  arr[i].sections![si].description = e.target.value
                  setGroups(arr)
                }} />
                <Input type="number" placeholder="Qty" value={section.quantity} onChange={(e) => {
                  const arr = [...groups]
                  arr[i].sections![si].quantity = +e.target.value
                  setGroups(arr)
                }} />
                <Input type="number" placeholder="Rate" value={section.rate} onChange={(e) => {
                  const arr = [...groups]
                  arr[i].sections![si].rate = +e.target.value
                  setGroups(arr)
                }} />
                <Input disabled value={section.quantity * section.rate} />
                <Button size="sm" variant="outline" onClick={() => addSubsection(i, si)}>
                  + Subsection
                </Button>
              </div>

              {section.subsections?.map((sub, subi) => (
                <div key={sub.id} className="ml-4 border-l pl-4 grid grid-cols-5 gap-2">
                  <Input placeholder="Subsection Name" value={sub.name} onChange={(e) => {
                    const arr = [...groups]
                    arr[i].sections![si].subsections![subi].name = e.target.value
                    setGroups(arr)
                  }} />
                  <Input placeholder="Description" value={sub.description || ""} onChange={(e) => {
                    const arr = [...groups]
                    arr[i].sections![si].subsections![subi].description = e.target.value
                    setGroups(arr)
                  }} />
                  <Input type="number" placeholder="Qty" value={sub.quantity} onChange={(e) => {
                    const arr = [...groups]
                    arr[i].sections![si].subsections![subi].quantity = +e.target.value
                    setGroups(arr)
                  }} />
                  <Input type="number" placeholder="Rate" value={sub.rate} onChange={(e) => {
                    const arr = [...groups]
                    arr[i].sections![si].subsections![subi].rate = +e.target.value
                    setGroups(arr)
                  }} />
                  <Input disabled value={sub.quantity * sub.rate} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Create Estimate</h2>

      {/* Top Section with More Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <Input placeholder="Estimate Name" value={estimateName} onChange={(e) => setEstimateName(e.target.value)} />
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

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

      {/* Import Button */}
      <div className="flex justify-between items-center">
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

      {/* Main Table / Manual UI */}
      <div className="space-y-6 border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {imported ? "Imported Estimate Data" : "Manual Entry"}
          </h3>
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
