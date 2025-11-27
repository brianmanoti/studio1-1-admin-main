import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"
import { useProjectStore } from "@/stores/projectStore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  // Initialize selection when data loads
  useEffect(() => {
    if (!transformedData.groups.length) return

    setSelected(prev => {
      // Only update if empty
      if (prev.groupId && prev.sectionId && prev.subsectionId) return prev

      const firstGroup = transformedData.groups[0]
      return {
        groupId: prev.groupId || firstGroup.key,
        sectionId: prev.sectionId || firstGroup.sections?.[0]?.key || "",
        subsectionId: prev.subsectionId || firstGroup.sections?.[0]?.subsections?.[0]?.key || "",
      }
    })
  }, [transformedData])

  // Emit changes when selection or level changes
  useEffect(() => {
    if (!selected.groupId) return // Don't emit until we have data

    const targetId =
      estimateLevel === "group"
        ? selected.groupId
        : estimateLevel === "section"
        ? selected.sectionId
        : estimateLevel === "subsection"
        ? selected.subsectionId
        : null

    if (targetId) {
      emit(targetId)
    }
  }, [selected, estimateLevel, emit])

  // Handle level change
  const handleLevelChange = useCallback((value) => {
    setEstimateLevel(value)
  }, [])

  // Handle select changes
  const handleSelect = useCallback(
    (key, value) => {
      setSelected(prev => {
        let next = { ...prev, [key]: value }

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

        return next
      })
    },
    [allSections, allSubsections, transformedData]
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
        <Select value={estimateLevel} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="estimate">Estimate (Whole)</SelectItem>
            <SelectItem value="group">Group</SelectItem>
            <SelectItem value="section">Section</SelectItem>
            <SelectItem value="subsection">Subsection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Group Selector */}
      {(estimateLevel === "group" || estimateLevel === "section" || estimateLevel === "subsection") && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Group</label>
          <Select 
            value={selected.groupId} 
            onValueChange={(value) => handleSelect("groupId", value)}
          >
            <SelectTrigger className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {transformedData.groups.map(g => (
                <SelectItem key={g.key} value={g.key}>
                  {g.code} - {g.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Section Selector (only if group has sections) */}
      {estimateLevel !== "group" && filteredSections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Section</label>
          <Select 
            value={selected.sectionId} 
            onValueChange={(value) => handleSelect("sectionId", value)}
          >
            <SelectTrigger className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {filteredSections.map(s => (
                <SelectItem key={s.key} value={s.key}>
                  {s.code} - {s.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Subsection Selector (only if section has subsections) */}
      {estimateLevel === "subsection" && filteredSubsections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Subsection</label>
          <Select 
            value={selected.subsectionId} 
            onValueChange={(value) => handleSelect("subsectionId", value)}
          >
            <SelectTrigger className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400">
              <SelectValue placeholder="Select subsection" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubsections.map(ss => (
                <SelectItem key={ss.key} value={ss.key}>
                  {ss.code} - {ss.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}