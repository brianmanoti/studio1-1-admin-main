import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

export function AddVariationButton({ projectId }: { projectId: string }) {
  const navigate = useNavigate()

  return (
    <Button
      className="mt-3 flex items-center"
      onClick={() => navigate({ to: `/projects/${projectId}/estimates/variations` })}
    >
      <Plus className="w-4 h-4 mr-2" /> Add Variation
    </Button>
  )
}
