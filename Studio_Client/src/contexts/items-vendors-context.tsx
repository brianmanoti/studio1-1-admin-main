import { createContext, useState, type ReactNode } from "react"

export interface Item {
  _id?: string
  id?: string
  description: string
  unit: string
  unitPrice: number
  name?: string
}

export interface Vendor {
  _id?: string
  id?: string
  companyName?: string
  vendorName: string
  vendorEmail?: string
  vendorPhone?: string
  vendorAddress?: string
  vendorContact?: string
  category?: string
  name?: string
  email?: string
}

interface FormState {
  type: "add-item" | "edit-item" | "add-vendor" | "edit-vendor" | null
  data?: Item | Vendor
}

export interface ItemsVendorsContextType {
  items: Item[]
  vendors: Vendor[]
  formState: FormState
  setFormState: (state: FormState) => void
  addItem: (item: Item) => void
  updateItem: (id: string, item: Item) => void
  deleteItem: (id: string) => void
  addVendor: (vendor: Vendor) => void
  updateVendor: (id: string, vendor: Vendor) => void
  deleteVendor: (id: string) => void
}

export const ItemsVendorsContext = createContext<ItemsVendorsContextType | undefined>(undefined)

export function ItemsVendorsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [formState, setFormState] = useState<FormState>({ type: null })

  const addItem = (item: Item) => {
    setItems((prev) => [...prev, item])
  }

  const updateItem = (id: string, item: Item) => {
    setItems((prev) => prev.map((i) => (i.id === id || i._id === id ? item : i)))
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id && i._id !== id))
  }

  const addVendor = (vendor: Vendor) => {
    setVendors((prev) => [...prev, vendor])
  }

  const updateVendor = (id: string, vendor: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === id || v._id === id ? vendor : v)))
  }

  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id && v._id !== id))
  }

  return (
    <ItemsVendorsContext.Provider
      value={{
        items,
        vendors,
        formState,
        setFormState,
        addItem,
        updateItem,
        deleteItem,
        addVendor,
        updateVendor,
        deleteVendor,
      }}
    >
      {children}
    </ItemsVendorsContext.Provider>
  )
}
