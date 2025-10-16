import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Download, FileText } from "lucide-react"
import axiosInstance from "@/lib/axios"
import { useProjectStore } from "@/stores/projectStore"
import { useNavigate } from "@tanstack/react-router"

interface Subsection {
  id?: string
  code?: string
  name: string
  description?: string
  quantity: number
  unit?: string
  rate: number
  amount?: number
  spent?: number
  balance?: number
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
  spent?: number
  balance?: number
  subsections?: Subsection[]
}

interface Group {
  id?: string
  code?: string
  name: string
  description?: string
  quantity?: number
  unit?: string
  rate?: number
  amount?: number
  spent?: number
  balance?: number
  sections?: Section[]
}

interface Project {
  _id: string
  name: string
  location?: string
  projectNumber?: string
}

interface Estimate {
  id: string
  projectId?: Project
  name: string
  description?: string
  notes?: string
  date?: string
  status?: string
  total?: number
  spent?: number
  balance?: number
  groups?: Group[]
}

export default function EstimateView() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const navigate = useNavigate()

  const projectId = useProjectStore((state) => state.projectId) // Replace with your actual project ID

const { data = [], isLoading, isError, error } = useQuery({
  queryKey: ["estimates", projectId],
  queryFn: async () => {
    try {
      const res = await axiosInstance.get(`/api/estimates/project/${projectId}`)
      return res.data as Estimate[]
    } catch (err: any) {
      // 👇 If backend returns 404 (no estimates), return an empty array instead of throwing
      if (err.response?.status === 404) {
        return []
      }
      throw err // rethrow other errors (e.g., 500, network)
    }
  },
  enabled: !!projectId,
})

const formatKES = (value?: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(value || 0)

if (isLoading)
  return (
    <p className="text-center mt-10 text-blue-600 font-medium text-lg">
      Loading estimates...
    </p>
  )

// Only show this if it's a real error (not a 404)
if (isError && !Array.isArray(data))
  return (
    <p className="text-center mt-10 text-red-600 font-medium text-lg">
      Failed to load estimates: {error?.response?.data?.error || "Unknown error"}
    </p>
  )

if (!data.length)
  return (
    <div className="text-center p-8 border rounded-lg bg-blue-50">
      <p className="mb-4 text-blue-700 font-medium">No estimates yet.</p>
      <Button onClick={() => navigate({ to: `/projects/${projectId}/purchaseOrders/new` })} className="bg-blue-600 text-white hover:bg-blue-700">
        + Add New Estimate
      </Button>
    </div>
  )


  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Top Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-blue-700">Estimates</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50">
            <FileText className="w-4 h-4" /> Export
          </Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
            + Add New Estimate
          </Button>
        </div>
      </div>

      {data.map((estimate) => {
        const isOpen = expanded[estimate.id] ?? true
        const totalAmount = estimate.total ?? 0
        const totalSpent = estimate.spent ?? 0
        const totalBalance = estimate.balance ?? 0

        return (
          <div key={estimate.id} className="border rounded-lg overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-blue-50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b gap-2 md:gap-0">
              <div className="space-y-1 text-left">
                <h3 className="font-semibold text-lg text-blue-700">{estimate.name || "—"}</h3>
                <p className="text-blue-600">
                  {estimate.projectId?.name || "—"}{" "}
                  {estimate.projectId?.location && `- ${estimate.projectId.location}`}
                </p>
                <p className="text-blue-500 text-sm">
                  Project No: {estimate.projectId?.projectNumber || "—"}
                </p>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0 flex-wrap">
                <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [estimate.id]: !prev[estimate.id] }))
                  }
                >
                  {isOpen ? "Collapse" : "Expand"}
                </Button>
              </div>
            </div>

            {/* Estimate Details */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 bg-blue-50 border-b text-blue-800">
              <div>
                <strong>Status:</strong> {estimate.status || "—"}
              </div>
              <div>
                <strong>Date:</strong> {estimate.date || "—"}
              </div>
              <div>
                <strong>Description:</strong> {estimate.description || "—"}
              </div>
              <div>
                <strong>Notes:</strong> {estimate.notes || "—"}
              </div>
              <div>
                <strong>Total:</strong> {formatKES(totalAmount)}
              </div>
              <div>
                <strong>Spent:</strong> {formatKES(totalSpent)}
              </div>
              <div>
                <strong>Balance:</strong> {formatKES(totalBalance)}
              </div>
            </div>

            {/* Nested Table */}
            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse [&_th]:font-semibold [&_td]:text-blue-800 [&_tr:hover]:bg-blue-50 transition-colors">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-3 py-2 w-8"></th>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-center">Unit</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-right">Spent</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.groups?.map((g) => (
                      <>
                        <tr
                          key={g.id}
                          className="bg-blue-50 font-semibold cursor-pointer"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [g.id]: !prev[g.id] }))
                          }
                        >
                          <td className="px-3 py-2 text-center">
                            {g.sections?.length ? (
                              expanded[g.id] ? (
                                <ChevronDown className="w-4 h-4 inline" />
                              ) : (
                                <ChevronRight className="w-4 h-4 inline" />
                              )
                            ) : (
                              <span>–</span>
                            )}
                          </td>
                          <td>{g.code || "—"}</td>
                          <td>{g.name || "—"}</td>
                          <td>{g.description || "—"}</td>
                          <td className="text-right">{g.quantity ?? 0}</td>
                          <td className="text-center">{g.unit || "—"}</td>
                          <td className="text-right">{formatKES(g.rate)}</td>
                          <td className="text-right">
                            {formatKES(g.amount ?? (g.rate || 0) * (g.quantity ?? 0))}
                          </td>
                          <td className="text-right">{formatKES(g.spent)}</td>
                          <td className="text-right">{formatKES(g.balance)}</td>
                        </tr>

                        {expanded[g.id] &&
                          g.sections?.map((s) => (
                            <>
                              <tr key={s.id} className="bg-blue-100">
                                <td></td>
                                <td>{s.code || "—"}</td>
                                <td className="pl-6">↳ {s.name || "—"}</td>
                                <td>{s.description || "—"}</td>
                                <td className="text-right">{s.quantity ?? 0}</td>
                                <td className="text-center">{s.unit || "—"}</td>
                                <td className="text-right">{formatKES(s.rate)}</td>
                                <td className="text-right">
                                  {formatKES(s.amount ?? (s.rate || 0) * (s.quantity ?? 0))}
                                </td>
                                <td className="text-right">{formatKES(s.spent)}</td>
                                <td className="text-right">{formatKES(s.balance)}</td>
                              </tr>

                              {s.subsections?.map((sub) => (
                                <tr key={sub.id} className="bg-blue-50">
                                  <td></td>
                                  <td>{sub.code || "—"}</td>
                                  <td className="pl-10 text-sm">↳ {sub.name || "—"}</td>
                                  <td>{sub.description || "—"}</td>
                                  <td className="text-right">{sub.quantity ?? 0}</td>
                                  <td className="text-center">{sub.unit || "—"}</td>
                                  <td className="text-right">{formatKES(sub.rate)}</td>
                                  <td className="text-right">
                                    {formatKES(sub.amount ?? (sub.rate || 0) * (sub.quantity ?? 0))}
                                  </td>
                                  <td className="text-right">{formatKES(sub.spent)}</td>
                                  <td className="text-right">{formatKES(sub.balance)}</td>
                                </tr>
                              ))}
                            </>
                          ))}
                      </>
                    ))}

                    {/* Footer Totals */}
                    <tr className="bg-blue-100 font-semibold">
                      <td colSpan={7} className="text-right px-3 py-2">
                        TOTAL
                      </td>
                      <td className="text-right px-3 py-2">{formatKES(totalAmount)}</td>
                      <td className="text-right px-3 py-2">{formatKES(totalSpent)}</td>
                      <td className="text-right px-3 py-2">{formatKES(totalBalance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
