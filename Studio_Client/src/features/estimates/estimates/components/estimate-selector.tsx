import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"
import { useProjectStore } from "@/stores/projectStore"

export default function EstimateSelector({ onChange }) {
  const projectId = useProjectStore((state) => state.projectId)
  const queryClient = useQueryClient()

  // ✅ Prefetch estimates safely
  useEffect(() => {
    if (projectId) {
      queryClient.prefetchQuery({
        queryKey: ["estimatesByProject", projectId],
        queryFn: async () => {
          try {
            const res = await axiosInstance.get(`/api/estimates/project/${projectId}`)
            return res.data
          } catch (err: any) {
            if (err.response?.status === 404) return []
            throw err
          }
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [projectId, queryClient])

  // ✅ Fetch project estimates
  const {
    data: estimates = [],
    isLoading: loadingEstimates,
    isError: estimateError,
  } = useQuery({
    queryKey: ["estimatesByProject", projectId],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/api/estimates/project/${projectId}`)
        return res.data
      } catch (err: any) {
        if (err.response?.status === 404) return []
        throw err
      }
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  })

  // ✅ Choose first estimate if available
  const estimateId = useMemo(() => estimates?.[0]?.estimateId ?? null, [estimates])

  // ✅ Prefetch structure only if an estimate exists
  useEffect(() => {
    if (estimateId) {
      queryClient.prefetchQuery({
        queryKey: ["estimateData", estimateId],
        queryFn: async () => {
          try {
            const res = await axiosInstance.get(`/api/estimates/${estimateId}/structure`)
            return res.data
          } catch (err: any) {
            if (err.response?.status === 404) return null
            throw err
          }
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [estimateId, queryClient])

  // ✅ Fetch the actual estimate structure
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["estimateData", estimateId],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/api/estimates/${estimateId}/structure`)
        return res.data
      } catch (err: any) {
        if (err.response?.status === 404) return null
        throw err
      }
    },
    enabled: !!estimateId,
    staleTime: 5 * 60 * 1000,
  })

  const [estimateLevel, setEstimateLevel] = useState("estimate")
  const [selected, setSelected] = useState({
    groupId: "",
    sectionId: "",
    subsectionId: "",
  })

  // ✅ Memoized derived data
  const allSections = useMemo(
    () =>
      data?.groups?.flatMap((g) =>
        (g.sections || []).map((s) => ({ ...s, groupId: g.key }))
      ) ?? [],
    [data]
  )

  const allSubsections = useMemo(
    () =>
      data?.groups?.flatMap((g) =>
        (g.sections || []).flatMap((s) =>
          (s.subsections || []).map((sub) => ({
            ...sub,
            sectionId: s.key,
            groupId: g.key,
          }))
        )
      ) ?? [],
    [data]
  )

  const filteredSections = useMemo(
    () =>
      selected.groupId
        ? allSections.filter((s) => s.groupId === selected.groupId)
        : allSections,
    [allSections, selected.groupId]
  )

  const filteredSubsections = useMemo(
    () =>
      selected.sectionId
        ? allSubsections.filter((sub) => sub.sectionId === selected.sectionId)
        : allSubsections,
    [allSubsections, selected.sectionId]
  )

  const emit = useCallback(
    (targetId) => {
      onChange?.({
        estimateId: data?.estimateId || "",
        estimateLevel,
        estimateTargetId: targetId || null,
      })
    },
    [onChange, data?.estimateId, estimateLevel]
  )

  const handleLevelChange = useCallback(
    (e) => {
      const level = e.target.value
      setEstimateLevel(level)
      setSelected({ groupId: "", sectionId: "", subsectionId: "" })
      emit(null)
    },
    [emit]
  )

  const handleSelect = useCallback(
    (key, value) => {
      let next = { ...selected, [key]: value }

      if (key === "groupId") {
        next.sectionId = ""
        next.subsectionId = ""
      } else if (key === "sectionId") {
        next.subsectionId = ""
        const section = allSections.find((sec) => sec.key === value)
        if (section) next.groupId = section.groupId
      } else if (key === "subsectionId") {
        const sub = allSubsections.find((ss) => ss.key === value)
        if (sub) {
          next.sectionId = sub.sectionId
          next.groupId = sub.groupId
        }
      }

      setSelected(next)

      const target =
        estimateLevel === "group"
          ? next.groupId
          : estimateLevel === "section"
          ? next.sectionId
          : estimateLevel === "subsection"
          ? next.subsectionId
          : null

      emit(target)
    },
    [allSections, allSubsections, estimateLevel, emit, selected]
  )

  // ✅ User feedback UI
  if (loadingEstimates || isLoading)
    return <div className="text-gray-500 text-sm">Loading estimate…</div>

  if (estimateError && estimates.length === 0)
    return (
      <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 p-3 rounded">
        No estimates found for this project.
      </div>
    )

  if (isError)
    return (
      <div className="text-red-500 text-sm">
        Failed to load estimate data:{" "}
        {error?.response?.data?.error || "Unexpected error"}
      </div>
    )

  if (!data)
    return (
      <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 p-3 rounded">
        No estimate structure available.
      </div>
    )

  // ✅ Main render
  return (
    <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
      {/* Estimate Level Selector */}
      <div>
        <label className="block text-sm font-medium text-blue-800 mb-1">
          Estimate Level
        </label>
        <select
          className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          value={estimateLevel}
          onChange={handleLevelChange}
        >
          <option value="estimate">Estimate (Whole)</option>
          <option value="group">Group</option>
          <option value="section">Section</option>
          <option value="subsection">Subsection</option>
        </select>
      </div>

      {/* Group Selector */}
      {(estimateLevel === "group" ||
        estimateLevel === "section" ||
        estimateLevel === "subsection") && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">
            Group
          </label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.groupId}
            onChange={(e) => handleSelect("groupId", e.target.value)}
          >
            <option value="">— Choose Group —</option>
            {(data.groups || []).map((g) => (
              <option key={g.key} value={g.key}>
                {g.value}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Section Selector */}
      {(estimateLevel === "section" || estimateLevel === "subsection") && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">
            Section
          </label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.sectionId}
            onChange={(e) => handleSelect("sectionId", e.target.value)}
            disabled={!selected.groupId}
          >
            <option value="">— Choose Section —</option>
            {filteredSections.map((s) => (
              <option key={s.key} value={s.key}>
                {s.value}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subsection Selector */}
      {estimateLevel === "subsection" && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">
            Subsection
          </label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.subsectionId}
            onChange={(e) => handleSelect("subsectionId", e.target.value)}
            disabled={!selected.sectionId}
          >
            <option value="">— Choose Subsection —</option>
            {filteredSubsections.map((ss) => (
              <option key={ss.key} value={ss.key}>
                {ss.value}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
