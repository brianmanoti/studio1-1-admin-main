import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useProjectStore } from '@/stores/projectStore';

export default function EstimateSelector({ onChange }) {
  const projectId = useProjectStore((state) => state.projectId);
  const queryClient = useQueryClient();

  // ✅ Prefetch estimates early whenever projectId changes
  useEffect(() => {
    if (projectId) {
      queryClient.prefetchQuery({
        queryKey: ['estimatesByProject', projectId],
        queryFn: async () => {
          const res = await axiosInstance.get(`/api/estimates/project/${projectId}`);
          return res.data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [projectId, queryClient]);

  // ✅ Fetch estimates for current project
  const {
    data: estimates,
    isLoading: loadingEstimates,
    isError: estimateError,
  } = useQuery({
    queryKey: ['estimatesByProject', projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/estimates/project/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const estimateId = useMemo(() => estimates?.[0]?.estimateId ?? null, [estimates]);

  // ✅ Prefetch the estimate structure as soon as we know estimateId
  useEffect(() => {
    if (estimateId) {
      queryClient.prefetchQuery({
        queryKey: ['estimateData', estimateId],
        queryFn: async () => {
          const res = await axiosInstance.get(`/api/estimates/${estimateId}/structure`);
          return res.data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [estimateId, queryClient]);

  // ✅ Fetch the actual estimate structure (will hit cache if prefetched)
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['estimateData', estimateId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/estimates/${estimateId}/structure`);
      return res.data;
    },
    enabled: !!estimateId,
    staleTime: 5 * 60 * 1000,
  });

  const [estimateLevel, setEstimateLevel] = useState('estimate');
  const [selected, setSelected] = useState({
    groupId: '',
    sectionId: '',
    subsectionId: '',
  });

  // ✅ Memoize derived data for speed
  const allSections = useMemo(() => {
    return data?.groups?.flatMap((g) =>
      (g.sections || []).map((s) => ({ ...s, groupId: g.key }))
    ) ?? [];
  }, [data]);

  const allSubsections = useMemo(() => {
    return data?.groups?.flatMap((g) =>
      (g.sections || []).flatMap((s) =>
        (s.subsections || []).map((sub) => ({
          ...sub,
          sectionId: s.key,
          groupId: g.key,
        }))
      )
    ) ?? [];
  }, [data]);

  const filteredSections = useMemo(() => {
    return selected.groupId
      ? allSections.filter((s) => s.groupId === selected.groupId)
      : allSections;
  }, [allSections, selected.groupId]);

  const filteredSubsections = useMemo(() => {
    return selected.sectionId
      ? allSubsections.filter((sub) => sub.sectionId === selected.sectionId)
      : allSubsections;
  }, [allSubsections, selected.sectionId]);

  // ✅ useCallback ensures no re-creation of functions
  const emit = useCallback(
    (targetId) => {
      onChange?.({
        estimateId: data?.estimateId || '',
        estimateLevel,
        estimateTargetId: targetId || null,
      });
    },
    [onChange, data?.estimateId, estimateLevel]
  );

  const handleLevelChange = useCallback(
    (e) => {
      const level = e.target.value;
      setEstimateLevel(level);
      setSelected({ groupId: '', sectionId: '', subsectionId: '' });
      emit(null);
    },
    [emit]
  );

  const handleSelect = useCallback(
    (key, value) => {
      let next = { ...selected, [key]: value };

      if (key === 'groupId') {
        next.sectionId = '';
        next.subsectionId = '';
      } else if (key === 'sectionId') {
        next.subsectionId = '';
        const section = allSections.find((sec) => sec.key === value);
        if (section) next.groupId = section.groupId;
      } else if (key === 'subsectionId') {
        const sub = allSubsections.find((ss) => ss.key === value);
        if (sub) {
          next.sectionId = sub.sectionId;
          next.groupId = sub.groupId;
        }
      }

      setSelected(next);

      const target =
        estimateLevel === 'group'
          ? next.groupId
          : estimateLevel === 'section'
          ? next.sectionId
          : estimateLevel === 'subsection'
          ? next.subsectionId
          : null;

      emit(target);
    },
    [allSections, allSubsections, estimateLevel, emit, selected]
  );

  // ✅ Friendly Loading & Error UI
  if (isLoading || loadingEstimates)
    return <div className="text-gray-500 text-sm">Loading estimate…</div>;

  if (isError || estimateError)
    return <div className="text-red-500 text-sm">Failed to load estimate data</div>;

  if (!data) return null;

  return (
    <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
      {/* Estimate Level Selector */}
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
      {(estimateLevel === 'group' ||
        estimateLevel === 'section' ||
        estimateLevel === 'subsection') && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Group</label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.groupId}
            onChange={(e) => handleSelect('groupId', e.target.value)}
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
      {(estimateLevel === 'section' || estimateLevel === 'subsection') && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Section</label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.sectionId}
            onChange={(e) => handleSelect('sectionId', e.target.value)}
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
      {estimateLevel === 'subsection' && (
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Subsection</label>
          <select
            className="w-full border border-blue-300 bg-white rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selected.subsectionId}
            onChange={(e) => handleSelect('subsectionId', e.target.value)}
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
  );
}
