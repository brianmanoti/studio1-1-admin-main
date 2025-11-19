import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"
import { useProjectStore } from "@/stores/projectStore"

export default function EstimateSelector({ onChange }) {
  const projectId = useProjectStore((state) => state.projectId)
  const queryClient = useQueryClient()

  // Prefetch estimates safely
  useEffect(() => {
    if (projectId) {
      queryClient.prefetchQuery({
        queryKey: ["estimatesByProject", projectId],
        queryFn: async () => {
          try {
            const res = await axiosInstance.get(`/api/estimates/project/${projectId}`)
            return res.data
          } catch (err) {
            if (err.response?.status === 404) return []
            throw err
          }
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [projectId, queryClient])

  // Fetch project estimates
  const { data: estimates = [], isLoading: loadingEstimates, isError: estimateError } = useQuery({
    queryKey: ["estimatesByProject", projectId],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/api/estimates/project/${projectId}`)
        return res.data
      } catch (err) {
        if (err.response?.status === 404) return []
        throw err
      }
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  })

  const estimateId = useMemo(() => estimates?.[0]?.estimateId ?? null, [estimates])

  // Prefetch estimate structure
  useEffect(() => {
    if (estimateId) {
      queryClient.prefetchQuery({
        queryKey: ["estimateData", estimateId],
        queryFn: async () => {
          try {
            const res = await axiosInstance.get(`/api/estimates/${estimateId}/structure`)
            return res.data
          } catch (err) {
            if (err.response?.status === 404) return null
            throw err
          }
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [estimateId, queryClient])

  // Fetch estimate structure
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["estimateData", estimateId],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/api/estimates/${estimateId}/structure`)
        return res.data
      } catch (err) {
        if (err.response?.status === 404) return null
        throw err
      }
    },
    enabled: !!estimateId,
    staleTime: 5 * 60 * 1000,
  })

  const [estimateLevel, setEstimateLevel] = useState("group")
  const [selected, setSelected] = useState({
    groupId: "",
    sectionId: "",
    subsectionId: "",
  })

  // Transform API data
  const transformedData = useMemo(() => {
    if (!data?.hierarchical?.groups) return { groups: [] }
    return {
      ...data,
      groups: data.hierarchical.groups.map(group => ({
        key: group.grpId,
        value: group.name,
        code: group.code,
        sections: (group.sections || []).map(section => ({
          key: section.secId,
          value: section.name,
          code: section.code,
          groupId: group.grpId,
          subsections: (section.subsections || []).map(sub => ({
            key: sub.subId,
            value: sub.name,
            code: sub.code,
            sectionId: section.secId,
            groupId: group.grpId,
          })),
        })),
      })),
    }
  }, [data])

  const allSections = useMemo(
    () => transformedData.groups.flatMap(g => (g.sections || []).map(s => ({ ...s, groupId: g.key }))) ?? [],
    [transformedData]
  )

  const allSubsections = useMemo(
    () =>
      transformedData.groups.flatMap(g =>
        (g.sections || []).flatMap(s =>
          (s.subsections || []).map(sub => ({
            ...sub,
            sectionId: s.key,
            groupId: g.key,
          }))
        )
      ) ?? [],
    [transformedData]
  )

  const filteredSections = useMemo(
    () => (selected.groupId ? allSections.filter(s => s.groupId === selected.groupId) : allSections),
    [allSections, selected.groupId]
  )

  const filteredSubsections = useMemo(
    () => (selected.sectionId ? allSubsections.filter(sub => sub.sectionId === selected.sectionId) : allSubsections),
    [allSubsections, selected.sectionId]
  )

  // Emit selection callback
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

  // Auto-select first available options professionally
  useEffect(() => {
    if (!transformedData.groups.length) return

    let firstGroupId = selected.groupId || transformedData.groups[0]?.key
    const group = transformedData.groups.find(g => g.key === firstGroupId)

    let firstSectionId = group?.sections?.[0]?.key || ""
    let firstSubsectionId = group?.sections?.[0]?.subsections?.[0]?.key || ""

    setSelected({
      groupId: firstGroupId,
      sectionId: firstSectionId,
      subsectionId: firstSubsectionId,
    })

    // Emit based on level
    let targetId =
      estimateLevel === "group"
        ? firstGroupId
        : estimateLevel === "section"
        ? firstSectionId
        : estimateLevel === "subsection"
        ? firstSubsectionId
        : null

    emit(targetId)
  }, [transformedData, estimateLevel, emit])

  // Handle level change
  const handleLevelChange = useCallback((e) => setEstimateLevel(e.target.value), [])

  // Handle select changes
  const handleSelect = useCallback(
    (key, value) => {
      let next = { ...selected, [key]: value }

      if (key === "groupId") {
        const group = transformedData.groups.find(g => g.key === value)
        next.sectionId = group?.sections?.[0]?.key || ""
        next.subsectionId = group?.sections?.[0]?.subsections?.[0]?.key || ""
      } else if (key === "sectionId") {
        const section = allSections.find(s => s.key === value)
        next.groupId = section?.groupId || next.groupId
        next.subsectionId = section?.subsections?.[0]?.key || ""
      } else if (key === "subsectionId") {
        const sub = allSubsections.find(ss => ss.key === value)
        next.sectionId = sub?.sectionId || next.sectionId
        next.groupId = sub?.groupId || next.groupId
      }

      setSelected(next)

      const targetId =
        estimateLevel === "group"
          ? next.groupId
          : estimateLevel === "section"
          ? next.sectionId
          : estimateLevel === "subsection"
          ? next.subsectionId
          : null

      emit(targetId)
    },
    [allSections, allSubsections, estimateLevel, emit, selected, transformedData]
  )

  // Loading / Error UI
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
        Failed to load estimate data: {error?.response?.data?.error || "Unexpected error"}
      </div>
    )

  if (!transformedData.groups.length)
    return (
      <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 p-3 rounded">
        No estimate structure available.
      </div>
    )

  return (
    <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
      {/* Level Selector */}
      <div>
        <label className="block text-sm font-medium text-blue-800 mb-1">Estimate Level</label>
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
      {(estimateLevel === "group" || estimateLevel === "section" || estimateLevel === "subsection") && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Group</label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.groupId}
            onChange={(e) => handleSelect("groupId", e.target.value)}
          >
            {transformedData.groups.map(g => (
              <option key={g.key} value={g.key}>
                {g.code} - {g.value}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Section Selector (only if group has sections) */}
      {estimateLevel !== "group" && filteredSections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Section</label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.sectionId}
            onChange={(e) => handleSelect("sectionId", e.target.value)}
          >
            {filteredSections.map(s => (
              <option key={s.key} value={s.key}>
                {s.code} - {s.value}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subsection Selector (only if section has subsections) */}
      {estimateLevel === "subsection" && filteredSubsections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Subsection</label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.subsectionId}
            onChange={(e) => handleSelect("subsectionId", e.target.value)}
          >
            {filteredSubsections.map(ss => (
              <option key={ss.key} value={ss.key}>
                {ss.code} - {ss.value}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
