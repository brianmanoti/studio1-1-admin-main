import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import { useItemsVendors } from "@/hooks/use-items-vendors"
import axiosInstance from "@/lib/axios"

interface SearchAutocompleteProps {
  type: "items" | "vendors"
}

export function SearchAutocomplete({ type }: SearchAutocompleteProps) {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const { setFormState } = useItemsVendors()

  const { data: searchResults = [] } = useQuery({
    queryKey: [type === "items" ? "itemsSearch" : "vendorsSearch", debouncedSearch],
    enabled: !!debouncedSearch.trim(),
    queryFn: async () => {
      const endpoint = type === "items" ? "/api/items/search" : "/api/vendors/search"
      const res = await axiosInstance.get(endpoint, { params: { q: debouncedSearch } })
      return res.data?.data || []
    },
  })

  const hasNoResults = debouncedSearch.trim() !== "" && searchResults.length === 0

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <Input
          placeholder={`Search ${type}...`}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full"
        />
      </div>

      {searchInput.trim() !== "" && (
        <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map((item) => (
              <div
                key={item.id || item._id}
                className="p-2 hover:bg-muted rounded cursor-pointer flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.unit && <p className="text-sm text-muted-foreground">{item.unit}</p>}
                  {item.unitPrice && <p className="text-sm text-muted-foreground">KES {item.unitPrice}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setFormState({
                      type: type === "items" ? "edit-item" : "edit-vendor",
                      data: item,
                    })
                  }
                >
                  Edit
                </Button>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center py-2">No {type} found</p>
              <Button
                className="w-full"
                onClick={() =>
                  setFormState({
                    type: type === "items" ? "add-item" : "add-vendor",
                  })
                }
              >
                + Add {type === "items" ? "Item" : "Vendor"}
              </Button>
            </div>
          )}
        </div>
      )}

      {searchInput.trim() === "" && (
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={() =>
            setFormState({
              type: type === "items" ? "add-item" : "add-vendor",
            })
          }
        >
          + Add {type === "items" ? "Item" : "Vendor"}
        </Button>
      )}
    </div>
  )
}
