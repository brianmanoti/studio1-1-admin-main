import { useState, useMemo, useCallback, useEffect, useRef } from "react"
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

interface EstimateSelectorProps {
  projectId?: string
  onChange?: (val: {
    estimateId: string
    estimateLevel: "estimate" | "group" | "section" | "subsection"
    estimateTargetId: string | null
  }) => void
  initialValues?: {
    estimateId: string
    estimateLevel: "estimate" | "group" | "section" | "subsection"
    estimateTargetId: string
  }
  disabled?: boolean
  compact?: boolean
}

export default function EstimateSelector({ 
  projectId: propProjectId, 
  onChange,
  initialValues,
  disabled = false,
  compact = false
}: EstimateSelectorProps) {
  const storeProjectId = useProjectStore((state) => state.projectId)
  const projectId = propProjectId ?? storeProjectId
  const queryClient = useQueryClient()
  
  // Refs to track initial setup and prevent infinite loops
  const isInitializedRef = useRef(false)
  const lastEmittedRef = useRef<string | null>(null)
  
  // Prevent clicks inside from bubbling
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Prefetch estimates
  useEffect(() => {
    if (!projectId) return
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
  }, [projectId, queryClient])

  // Fetch project estimates
  const { data: estimates = [], isLoading: loadingEstimates, isError: estimateError } = useQuery({
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

  // Use initial estimateId if provided, otherwise use first estimate
  const estimateId = useMemo(() => 
    initialValues?.estimateId || estimates?.[0]?.estimateId || null, 
    [initialValues?.estimateId, estimates]
  )

  // Prefetch estimate structure
  useEffect(() => {
    if (!estimateId) return
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
  }, [estimateId, queryClient])

  const { data, isLoading, isError, error } = useQuery({
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

  // Initialize state with initial values
  const [estimateLevel, setEstimateLevel] = useState<"estimate" | "group" | "section" | "subsection">(
    initialValues?.estimateLevel || "group"
  )
  
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
          (s.subsections || []).map(sub => ({ ...sub, sectionId: s.key, groupId: g.key }))
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

  // Find the exact target item by comparing IDs with structure data
  const findExactTargetItem = useCallback((targetId: string) => {
    if (!targetId) return null

    // Check groups - exact match
    const group = transformedData.groups.find(g => g.key === targetId)
    if (group) {
      return { 
        type: 'group', 
        groupId: group.key,
        sectionId: "",
        subsectionId: ""
      }
    }

    // Check sections - exact match
    const section = allSections.find(s => s.key === targetId)
    if (section) {
      return { 
        type: 'section', 
        groupId: section.groupId, 
        sectionId: section.key,
        subsectionId: ""
      }
    }

    // Check subsections - exact match
    const subsection = allSubsections.find(sub => sub.key === targetId)
    if (subsection) {
      return { 
        type: 'subsection', 
        groupId: subsection.groupId, 
        sectionId: subsection.sectionId, 
        subsectionId: subsection.key 
      }
    }

    return null
  }, [transformedData, allSections, allSubsections])

  // Initialize selection when data loads - COMPARE IDs WITH STRUCTURE
  useEffect(() => {
    if (!transformedData.groups.length || !estimateId || isInitializedRef.current) return

    // Case 1: We have initial values and need to find exact matches in structure
    if (initialValues?.estimateTargetId && initialValues.estimateLevel !== "estimate") {
      const exactMatch = findExactTargetItem(initialValues.estimateTargetId)
      
      if (exactMatch) {
        setSelected({
          groupId: exactMatch.groupId || "",
          sectionId: exactMatch.sectionId || "",
          subsectionId: exactMatch.subsectionId || "",
        })
        
        // Set the level from initial values
        if (initialValues.estimateLevel) {
          setEstimateLevel(initialValues.estimateLevel)
        }
        
        isInitializedRef.current = true
        return
      }
    }

    // Case 2: "estimate" level - clear selections
    if (initialValues?.estimateLevel === "estimate") {
      setSelected({
        groupId: "",
        sectionId: "",
        subsectionId: "",
      })
      isInitializedRef.current = true
      return
    }

    // Case 3: No initial values or no match found - use first available items
    const firstGroup = transformedData.groups[0]
    const firstSection = firstGroup?.sections?.[0]
    const firstSubsection = firstSection?.subsections?.[0]
    
    setSelected({
      groupId: firstGroup?.key || "",
      sectionId: firstSection?.key || "",
      subsectionId: firstSubsection?.key || "",
    })
    
    isInitializedRef.current = true
    
  }, [transformedData, initialValues, findExactTargetItem, estimateId])

  // Emit selection callback
  const emit = useCallback(
    (targetId: string | null) => {
      if (!estimateId || !onChange) return
      
      // Create a unique key for this emission to prevent duplicates
      const emissionKey = `${estimateId}-${estimateLevel}-${targetId}`
      
      // Only emit if this is a new value
      if (lastEmittedRef.current !== emissionKey) {
        lastEmittedRef.current = emissionKey
        
        onChange({
          estimateId: estimateId,
          estimateLevel,
          estimateTargetId: targetId,
        })
      }
    },
    [onChange, estimateId, estimateLevel]
  )

  // Emit changes when selection or level changes - FIXED to prevent loops
  useEffect(() => {
    if (!estimateId || !isInitializedRef.current) return
    
    let targetId: string | null = null
    
    if (estimateLevel === "estimate") {
      targetId = estimateId
    } else if (estimateLevel === "group" && selected.groupId) {
      targetId = selected.groupId
    } else if (estimateLevel === "section" && selected.sectionId) {
      targetId = selected.sectionId
    } else if (estimateLevel === "subsection" && selected.subsectionId) {
      targetId = selected.subsectionId
    }
    
    if (targetId) {
      emit(targetId)
    }
  }, [selected, estimateLevel, emit, estimateId])

  const handleLevelChange = useCallback((value: "estimate" | "group" | "section" | "subsection") => {
    setEstimateLevel(value)
    
    // When switching to "estimate" level, clear the selections
    if (value === "estimate") {
      setSelected({
        groupId: "",
        sectionId: "",
        subsectionId: "",
      })
    }
  }, [])

  const handleSelect = useCallback(
    (key: "groupId" | "sectionId" | "subsectionId", value: string) => {
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

  const handleSelectTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleSelectContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  if (loadingEstimates || isLoading)
    return <div className="text-gray-500 text-sm">Loading estimate…</div>

  if (estimateError && estimates.length === 0)
    return <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 p-3 rounded">No estimates found for this project.</div>

  if (isError)
    return <div className="text-red-500 text-sm">Failed to load estimate data: {error?.response?.data?.error || "Unexpected error"}</div>

  if (!transformedData.groups.length)
    return <div className="text-blue-700 text-sm bg-blue-50 border border-blue-200 p-3 rounded">No estimate structure available.</div>

  return (
    <div 
      className={`w-full ${compact ? 'p-2' : 'p-4'} bg-blue-50 border border-blue-200 rounded-md space-y-3`}
      onClick={handleContainerClick}
      onMouseDown={handleContainerMouseDown}
    >
      {/* Level Selector */}
      <div>
        <label className="block text-sm font-medium text-blue-800 mb-1">Estimate Level</label>
        <Select 
          value={estimateLevel} 
          onValueChange={handleLevelChange}
          disabled={disabled}
        >
          <SelectTrigger 
            className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400"
            onClick={handleSelectTriggerClick}
          >
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent onClick={handleSelectContentClick}>
            <SelectItem value="estimate">Estimate (Whole)</SelectItem>
            <SelectItem value="group">Group</SelectItem>
            <SelectItem value="section">Section</SelectItem>
            <SelectItem value="subsection">Subsection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show estimate info when level is "estimate" */}
      {estimateLevel === "estimate" && estimateId && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>Selected:</strong> Entire Estimate ({estimateId})
          </p>
        </div>
      )}

      {/* Group Selector */}
      {(estimateLevel === "group" || estimateLevel === "section" || estimateLevel === "subsection") && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Group</label>
          <Select 
            value={selected.groupId} 
            onValueChange={(v) => handleSelect("groupId", v)}
            disabled={disabled}
          >
            <SelectTrigger 
              className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400"
              onClick={handleSelectTriggerClick}
            >
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent onClick={handleSelectContentClick}>
              {transformedData.groups.map(g => (
                <SelectItem key={g.key} value={g.key}>{g.code} - {g.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Section Selector */}
      {(estimateLevel === "section" || estimateLevel === "subsection") && filteredSections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Section</label>
          <Select 
            value={selected.sectionId} 
            onValueChange={(v) => handleSelect("sectionId", v)}
            disabled={disabled}
          >
            <SelectTrigger 
              className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400"
              onClick={handleSelectTriggerClick}
            >
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent onClick={handleSelectContentClick}>
              {filteredSections.map(s => <SelectItem key={s.key} value={s.key}>{s.code} - {s.value}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Subsection Selector */}
      {estimateLevel === "subsection" && filteredSubsections.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Subsection</label>
          <Select 
            value={selected.subsectionId} 
            onValueChange={(v) => handleSelect("subsectionId", v)}
            disabled={disabled}
          >
            <SelectTrigger 
              className="w-full border border-blue-300 bg-white text-sm focus:ring-2 focus:ring-blue-400"
              onClick={handleSelectTriggerClick}
            >
              <SelectValue placeholder="Select subsection" />
            </SelectTrigger>
            <SelectContent onClick={handleSelectContentClick}>
              {filteredSubsections.map(ss => <SelectItem key={ss.key} value={ss.key}>{ss.code} - {ss.value}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}