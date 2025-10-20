"use client"

import { Button } from "@/components/ui/button"

type DocumentType = "wages" | "expenses" | "purchase-orders"

interface TypeSwitcherProps {
  activeType: DocumentType
  onTypeChange: (type: DocumentType) => void
}

export function TypeSwitcher({ activeType, onTypeChange }: TypeSwitcherProps) {
  const types: { value: DocumentType; label: string }[] = [
    { value: "wages", label: "Wages" },
    { value: "expenses", label: "Expenses" },
    { value: "purchase-orders", label: "Purchase Orders" },
  ]

  return (
    <div className="flex gap-2 mb-8">
      {types.map((type) => (
        <Button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          variant={activeType === type.value ? "default" : "outline"}
          className="px-6 py-2 font-medium transition-all"
        >
          {type.label}
        </Button>
      ))}
    </div>
  )
}
