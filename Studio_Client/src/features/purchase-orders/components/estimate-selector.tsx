import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export default function EstimateSelector({ onChange }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['estimateData'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/estimates/EST-ad981a8c0c41/structure');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const [estimateLevel, setEstimateLevel] = useState('estimate');
  const [selected, setSelected] = useState({
    groupId: '',
    sectionId: '',
    subsectionId: '',
  });

  // --- Flatten nested structure for easier lookup ---
  const allSections = useMemo(() => {
    if (!data?.groups) return [];
    return data.groups.flatMap((g) =>
      (g.sections || []).map((s) => ({
        ...s,
        groupId: g.key,
      }))
    );
  }, [data]);

  const allSubsections = useMemo(() => {
    if (!data?.groups) return [];
    return data.groups.flatMap((g) =>
      (g.sections || []).flatMap((s) =>
        (s.subsections || []).map((sub) => ({
          ...sub,
          sectionId: s.key,
          groupId: g.key,
        }))
      )
    );
  }, [data]);

  // --- Filtered options ---
  const filteredSections = useMemo(() => {
    if (!selected.groupId) return allSections;
    return allSections.filter((s) => s.groupId === selected.groupId);
  }, [allSections, selected.groupId]);

  const filteredSubsections = useMemo(() => {
    if (!selected.sectionId) return allSubsections;
    return allSubsections.filter((sub) => sub.sectionId === selected.sectionId);
  }, [allSubsections, selected.sectionId]);

  if (isLoading) return <div className="text-gray-500 text-sm">Loading estimate…</div>;
  if (isError) return <div className="text-red-500 text-sm">Failed to load estimate data</div>;
  if (!data) return null;

  // --- Emit selection up to parent ---
  const emit = (targetId) => {
    onChange?.({
      estimateId: data?.estimateId || '',
      estimateLevel,
      estimateTargetId: targetId || null,
    });
  };

  // --- Handlers ---
  const handleLevelChange = (e) => {
    const level = e.target.value;
    setEstimateLevel(level);
    setSelected({ groupId: '', sectionId: '', subsectionId: '' });
    emit(null);
  };

  const handleSelect = (key, value) => {
    let next = { ...selected, [key]: value };

    if (key === 'groupId') {
      next.sectionId = '';
      next.subsectionId = '';
    }
    if (key === 'sectionId') {
      next.subsectionId = '';
      const section = allSections.find((sec) => sec.key === value);
      if (section) next.groupId = section.groupId;
    }
    if (key === 'subsectionId') {
      const sub = allSubsections.find((ss) => ss.key === value);
      if (sub) {
        next.sectionId = sub.sectionId;
        next.groupId = sub.groupId;
      }
    }

    setSelected(next);

    let target = null;
    if (estimateLevel === 'group') target = next.groupId || null;
    if (estimateLevel === 'section') target = next.sectionId || null;
    if (estimateLevel === 'subsection') target = next.subsectionId || null;
    emit(target);
  };

  // --- UI ---
  return (
    <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
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

      {(estimateLevel === 'group' || estimateLevel === 'section' || estimateLevel === 'subsection') && (
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
