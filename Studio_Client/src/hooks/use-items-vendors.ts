import { useContext } from "react"
import { ItemsVendorsContext } from "@/contexts/items-vendors-context"

export function useItemsVendors() {
  const context = useContext(ItemsVendorsContext)
  if (!context) {
    throw new Error("useItemsVendors must be used within ItemsVendorsProvider")
  }
  return context
}
