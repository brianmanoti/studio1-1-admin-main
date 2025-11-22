import { useDebounce } from "@/hooks/useDebounce"
import axiosInstance from "@/lib/axios"
import { useMemo } from "react"

export const useSubcontractorsSearch = (searchValue, searchTrigger, form) => {
  const debouncedSearch = useDebounce(searchValue, 300)

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["subcontractors", "search", debouncedSearch, searchTrigger],
    queryFn: async () => {
      try {
        const query = debouncedSearch.trim()
        const url = `/api/subcontractors/search?q=${encodeURIComponent(query)}`
        const res = await axiosInstance.get(url)
        return Array.isArray(res.data?.results) ? res.data.results : []
      } catch (err) {
        console.error("Error fetching subcontractors:", err)
        return []
      }
    },
    staleTime: 1000 * 60 * 10,
    enabled: true,
  })

  const selected = useMemo(() => {
    if (!form?.subcontractorId) return null
    return data.find(sub => sub._id === form.subcontractorId) || null
  }, [form?.subcontractorId, data])

  return { subcontractorsData: data, selectedSubcontractor: selected, isLoading, isError, error }
}
