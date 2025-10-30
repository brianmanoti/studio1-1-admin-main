"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import axiosInstance from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash, ChevronDown, ChevronRight } from "lucide-react"

// Currency formatter
const formatKsh = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value)

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// Generate code recursively
const generateCode = (path: number[]): string => {
  return path
    .map((idx, level) => {
      if (level === 0) return ALPHABET[idx] // top = letters
      return idx + 1 // deeper = numbers
    })
    .join(".")
}

// Reindex recursively after add/remove
const reindex = (items: any[], path: number[] = []): any[] => {
  return items.map((item, i) => {
    const newPath = [...path, i]
    const newCode = generateCode(newPath)
    return {
      ...item,
      code: newCode,
      children: reindex(item.children || [], newPath),
    }
  })
}

export default function VariationsForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: estimates = [] } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => (await axiosInstance.get("/api/estimates")).data,
  })

  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    estimateId: "",
    description: "",
    notes: "",
    status: "Pending Approval",
    items: [] as any[],
  })

  const [expanded, setExpanded] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: async (data) => await axiosInstance.post("/api/variations", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["variations"])
      navigate({ to: "/projects/$projectId/estimates/variations" })
    },
  })

  const handleChange = (path: string, value: any) => {
    const keys = path.split(".")
    setFormData((prev) => {
      const newData = structuredClone(prev)
      let obj: any = newData
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return newData
    })
  }

// Add item based on depth (0 = group, 1 = section, 2 = subsection)
const addItem = (path: number[] = []) => {
  const newData = structuredClone(formData)
  let target = newData.items

  // Navigate to the correct depth
  for (let i = 0; i < path.length; i++) {
    target = target[path[i]].children
  }

  // Determine item type based on level
  const level = path.length
  const label =
    level === 0 ? "Group" : level === 1 ? "Section" : "Subsection"

  target.push({
    code: "",
    name: `${label} Name`,
    description: "",
    quantity: 0,
    unit: "",
    rate: 0,
    amount: 0,
    notes: [] as string[],
    children: [],
  })

  newData.items = reindex(newData.items)
  setFormData(newData)
}


  const removeItem = (path: number[]) => {
    const newData = structuredClone(formData)
    let target = newData.items
    for (let i = 0; i < path.length - 1; i++) target = target[path[i]].children
    target.splice(path[path.length - 1], 1)

    newData.items = reindex(newData.items)
    setFormData(newData)
  }

  const toggleExpand = (code: string) => {
    setExpanded((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const transform = (items: any[]): any[] =>
      items.map((item) => ({
        code: item.code,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.quantity * item.rate,
        notes: item.notes,
        sections: item.children ? transform(item.children) : [],
        subsections: item.children && item.children.length > 0 ? undefined : [],
      }))

    const payload = {
      name: formData.name,
      projectId: formData.projectId,
      estimateId: formData.estimateId,
      description: formData.description,
      notes: formData.notes,
      status: formData.status,
      groups: transform(formData.items),
    }

    mutation.mutate(payload)
  }

  const calcAmount = (quantity: number, rate: number) => quantity * rate

  const totalAmount = (items: any[]): number =>
    items.reduce(
      (sum, item) =>
        sum +
        calcAmount(item.quantity, item.rate) +
        totalAmount(item.children || []),
      0
    )

  const renderRows = (items: any[], path: number[] = [], level: number = 0) =>
    items.map((item, i) => {
      const newPath = [...path, i]
      return (
        <>
          <tr
            key={item.code}
            className={
              level === 0
                ? "bg-white font-semibold"
                : level === 1
                ? "bg-gray-50"
                : "bg-gray-100"
            }
          >
            <td
              className={`border px-2 py-1 pl-${level * 10} flex items-center gap-2 min-w-[200px]`}
            >
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => toggleExpand(item.code)}
              >
                {expanded.includes(item.code) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
              <span className="font-mono text-sm text-gray-500">{item.code}</span>
              <Input
                value={item.name}
                placeholder={`Name`}
                onChange={(e) =>
                  handleChange(
                    `items.${newPath.join(".children.")}.name`,
                    e.target.value
                  )
                }
                className="w-full"
              />
            </td>
            <td className="border px-2 py-1 text-center min-w-[120px]">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleChange(
                    `items.${newPath.join(".children.")}.quantity`,
                    Number(e.target.value)
                  )
                }
              />
            </td>
            <td className="border px-2 py-1 text-center min-w-[100px]">
              <Input
                value={item.unit}
                onChange={(e) =>
                  handleChange(
                    `items.${newPath.join(".children.")}.unit`,
                    e.target.value
                  )
                }
              />
            </td>
            <td className="border px-2 py-1 text-center min-w-[150px]">
              <Input
                type="number"
                value={item.rate}
                onChange={(e) =>
                  handleChange(
                    `items.${newPath.join(".children.")}.rate`,
                    Number(e.target.value)
                  )
                }
              />
            </td>
            <td className="border px-2 py-1 text-center min-w-[150px]">
              {formatKsh(calcAmount(item.quantity, item.rate))}
            </td>
            <td className="border px-2 py-1 text-right min-w-[100px]">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => removeItem(newPath)}
              >
                <Trash className="w-3 h-3" />
              </Button>
            </td>
          </tr>

          {expanded.includes(item.code) &&
            renderRows(item.children, newPath, level + 1)}

        {expanded.includes(item.code) && (
          <tr>
            <td colSpan={6} className={`border px-2 py-2 pl-${(level + 1) * 10}`}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full justify-start text-muted-foreground border-dashed"
                onClick={() => addItem(newPath)}
              >
                <Plus className="w-3 h-3 mr-2" />
                {level === 0
                  ? "Add Section"
                  : level === 1
                  ? "Add Subsection"
                  : "Add Group"}
              </Button>
            </td>
          </tr>
        )}

        </>
      )
    })

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          type="button"
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() =>
            window.history.length > 1 ? window.history.back() : navigate({ to: "/" })
          }
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>
        <h1 className="text-xl sm:text-2xl font-semibold">Create Variation</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Input
            placeholder="Variation Name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          <Select onValueChange={(v) => handleChange("estimateId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Estimate" />
            </SelectTrigger>
            <SelectContent>
              {estimates.map((e: any) => (
                <SelectItem key={e.estimateId} value={e.estimateId}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />
        <Textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
        />

        {/* Responsive Table */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-[800px] w-full border border-gray-200 table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left w-1/3 min-w-[200px]">
                  Item
                </th>
                <th className="border px-2 py-1 text-center min-w-[120px]">
                  Quantity
                </th>
                <th className="border px-2 py-1 text-center min-w-[100px]">
                  Unit
                </th>
                <th className="border px-2 py-1 text-center min-w-[150px]">
                  Rate (Ksh)
                </th>
                <th className="border px-2 py-1 text-center min-w-[150px]">
                  Amount
                </th>
                <th className="border px-2 py-1 text-right min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {renderRows(formData.items)}

              <tr>
                <td colSpan={6} className="border px-2 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-muted-foreground border-dashed"
                    onClick={() => addItem([])}
                  >
                    <Plus className="w-3 h-3 mr-2" /> Add Group
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-right text-lg sm:text-xl font-semibold mt-4">
          Total: {formatKsh(totalAmount(formData.items))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            type="submit"
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {mutation.isPending ? "Saving..." : "Save Variation"}
          </Button>
        </div>
      </form>
    </div>
  )
}
