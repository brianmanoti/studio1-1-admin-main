"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useItemsVendors } from "@/hooks/use-items-vendors"
import axiosInstance from "@/lib/axios"
import type { Item } from "@/contexts/items-vendors-context"

// ✅ Validation Schema
const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().min(1, "Description is required"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
})

type ItemFormData = z.infer<typeof itemSchema>

interface ItemFormModalProps {
  onSave: (item: Item) => void
}

export function ItemFormModal({ onSave }: ItemFormModalProps) {
  const { formState, setFormState } = useItemsVendors()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      unitPrice: 0,
    },
  })

  const saveItemMutation = useMutation({
    mutationFn: async (item: ItemFormData & { _id?: string }) => {
      if (item._id) {
        return axiosInstance.put(`/api/items/${item._id}`, item).then((res) => res.data)
      }
      return axiosInstance.post("/api/items", item).then((res) => res.data)
    },
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ["itemsSearch"] })
      queryClient.invalidateQueries({ queryKey: ["itemsList"] })
      onSave(savedItem)
      setFormState({ type: null })
    },
    onError: (error) => {
      console.error("Failed to save item:", error)
      alert("Failed to save item. Please try again.")
    },
  })

  useEffect(() => {
    if (formState.type?.includes("edit") && formState.data) {
      const data = formState.data as Item
      reset({
        name: data.name,
        description: data.description,
        unit: data.unit,
        unitPrice: data.unitPrice || 0,
      })
    } else if (formState.type === "add-item") {
      reset({ name: "", description: "", unit: "", unitPrice: 0 })
    }
  }, [formState, reset])

  if (!formState.type?.includes("item")) return null

  const onSubmit = (data: ItemFormData) => {
    saveItemMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-blue-100/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-6 text-center">
          {formState.type === "add-item" ? "Add New Item" : "Edit Item"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input
              type="text"
              {...register("name")}
              className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                errors.name ? "border-red-400" : "border-blue-200"
              }`}
              placeholder="e.g., Cement"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              {...register("description")}
              className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                errors.description ? "border-red-400" : "border-blue-200"
              }`}
              placeholder="Item description"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <input
              type="text"
              {...register("unit")}
              className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                errors.unit ? "border-red-400" : "border-blue-200"
              }`}
              placeholder="e.g., bag, kg, m"
            />
            {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>}
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KSh)</label>
            <input
              type="number"
              {...register("unitPrice", { valueAsNumber: true })}
              className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                errors.unitPrice ? "border-red-400" : "border-blue-200"
              }`}
              placeholder="0"
            />
            {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-blue-100">
            <button
              type="button"
              onClick={() => setFormState({ type: null })}
              className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
