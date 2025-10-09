import { useProjectStore } from '@/stores/projectStore'

export function ProjectDebug() {
  const projectId = useProjectStore((state) => state.projectId)

  return (
    <div className="p-2 bg-gray-100 border-b">
      <p className="text-sm">
        🧠 Current Project ID from Zustand:{" "}
        <span className="font-semibold">{projectId ?? 'None'}</span>
      </p>
    </div>
  )
}
