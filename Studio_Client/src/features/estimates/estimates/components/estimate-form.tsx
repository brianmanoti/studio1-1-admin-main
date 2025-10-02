"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Trash2 } from "lucide-react"

interface EstimateData {
  projectId: string
  groups: Group[]
}

interface Group {
  name: string
  quantity: number
  rate: number
  total: number
  sections: Section[]
}

interface Section {
  name: string
  quantity: number
  rate: number
  total: number
  subsections: Subsection[]
}

interface Subsection {
  name: string
  quantity: number
  rate: number
  total: number
}

export default function EstimateForm() {
  const [projectId, setProjectId] = useState<string>("")
  const [groups, setGroups] = useState<Group[]>([])
  const [imported, setImported] = useState(false)

  // ✅ Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  // ✅ Save Estimate Mutation
  const mutation = useMutation({
    mutationFn: async (data: EstimateData) => {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save estimate")
      return res.json()
    },
    onSuccess: () => toast.success("Estimate saved successfully!"),
    onError: () => toast.error("Failed to save estimate"),
  })

  // ✅ Import Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    toast.message("Processing import...")

    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/import-estimate", { method: "POST", body: formData })
    if (!res.ok) return toast.error("Import failed")
    const json = await res.json()

    setGroups(json.groups || [])
    setImported(true)
    toast.success("Import successful! Data populated.")
  }

  // ✅ Group handlers
  const addGroup = () => {
    setGroups([...groups, { name: "", quantity: 0, rate: 0, total: 0, sections: [] }])
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

  // ✅ Submit
  const handleSubmit = () => {
    if (!projectId) return toast.error("Select a project first")
    mutation.mutate({ projectId, groups })
  }

  // ✅ UI Components
  const renderSubsection = (sub: Subsection, j: number, update: (val: Subsection) => void, remove: () => void) => (
    <div key={j} className="grid grid-cols-5 gap-2 ml-8 mt-2 items-center">
      <Input placeholder="Subsection Name" value={sub.name} onChange={(e) => update({ ...sub, name: e.target.value })} />
      <Input type="number" placeholder="Qty" value={sub.quantity} onChange={(e) => update({ ...sub, quantity: +e.target.value, total: +e.target.value * sub.rate })} />
      <Input type="number" placeholder="Rate" value={sub.rate} onChange={(e) => update({ ...sub, rate: +e.target.value, total: +e.target.value * sub.quantity })} />
      <Input disabled value={sub.total} />
      <Button size="icon" variant="ghost" onClick={remove}><Trash2 className="w-4 h-4 text-red-500" /></Button>
    </div>
  )

  const renderSection = (section: Section, j: number, update: (val: Section) => void, remove: () => void) => (
    <div key={j} className="border-l-2 border-blue-300 pl-4 mt-4 space-y-2">
      <div className="grid grid-cols-5 gap-2 items-center">
        <Input placeholder="Section Name" value={section.name} onChange={(e) => update({ ...section, name: e.target.value })} />
        <Input type="number" placeholder="Qty" value={section.quantity} onChange={(e) => update({ ...section, quantity: +e.target.value, total: +e.target.value * section.rate })} />
        <Input type="number" placeholder="Rate" value={section.rate} onChange={(e) => update({ ...section, rate: +e.target.value, total: +e.target.value * section.quantity })} />
        <Input disabled value={section.total} />
        <Button size="icon" variant="ghost" onClick={remove}><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </div>

      {section.subsections.map((sub, k) =>
        renderSubsection(
          sub,
          k,
          (updated) => {
            const subs = [...section.subsections]
            subs[k] = updated
            const total = subs.reduce((sum, s) => sum + s.total, 0)
            update({ ...section, subsections: subs, total })
          },
          () => {
            if (confirm("Delete this subsection?")) {
              const subs = section.subsections.filter((_, idx) => idx !== k)
              const total = subs.reduce((sum, s) => sum + s.total, 0)
              update({ ...section, subsections: subs, total })
            }
          }
        )
      )}

      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          update({ ...section, subsections: [...section.subsections, { name: "", quantity: 0, rate: 0, total: 0 }] })
        }
      >
        + Add Subsection
      </Button>
    </div>
  )

  const renderGroup = (group: Group, i: number) => (
    <div key={i} className="border rounded-lg p-4 space-y-4 bg-muted/40">
      <div className="grid grid-cols-5 gap-2 items-center">
        <Input placeholder="Group Name" value={group.name} onChange={(e) => updateGroup(i, { ...group, name: e.target.value })} />
        <Input type="number" placeholder="Qty" value={group.quantity} onChange={(e) => updateGroup(i, { ...group, quantity: +e.target.value, total: +e.target.value * group.rate })} />
        <Input type="number" placeholder="Rate" value={group.rate} onChange={(e) => updateGroup(i, { ...group, rate: +e.target.value, total: +e.target.value * group.quantity })} />
        <Input disabled value={group.total} />
        <Button size="icon" variant="ghost" onClick={() => deleteGroup(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </div>

      {group.sections.map((section, j) =>
        renderSection(
          section,
          j,
          (updated) => {
            const secs = [...group.sections]
            secs[j] = updated
            const total = secs.reduce((sum, s) => sum + s.total, 0)
            updateGroup(i, { ...group, sections: secs, total })
          },
          () => {
            if (confirm("Delete this section?")) {
              const secs = group.sections.filter((_, idx) => idx !== j)
              const total = secs.reduce((sum, s) => sum + s.total, 0)
              updateGroup(i, { ...group, sections: secs, total })
            }
          }
        )
      )}

      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          updateGroup(i, {
            ...group,
            sections: [...group.sections, { name: "", quantity: 0, rate: 0, total: 0, subsections: [] }],
          })
        }
      >
        + Add Section
      </Button>
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

        <label className="cursor-pointer flex items-center gap-2 text-sm border rounded px-4 py-2 hover:bg-muted">
          <Upload className="w-4 h-4" />
          Import Excel
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} hidden />
        </label>
      </div>

      {/* Groups */}
      <div className="space-y-6 border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {imported ? "Imported Estimate Data" : "Manual Entry"}
          </h3>
          <Button onClick={addGroup}>+ Add Group</Button>
        </div>

        {groups.length === 0 && (
          <p className="text-muted-foreground text-sm italic text-center">
            No groups yet. Start by adding or importing.
          </p>
        )}

        <div className="space-y-4">{groups.map((g, i) => renderGroup(g, i))}</div>

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
