import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useItemsVendors } from "@/hooks/use-items-vendors"
import axiosInstance from "@/lib/axios"

const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Unit price must be non-negative"),
})

const ItemsArraySchema = z.object({
  items: z.array(ItemSchema).min(1, "At least one item is required"),
})

type ItemFormData = z.infer<typeof ItemsArraySchema>

export function ItemFormModal({ onSave }: { onSave: (items: any[]) => void }) {
  const { formState, setFormState } = useItemsVendors()
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(ItemsArraySchema),
    defaultValues: {
      items: [{ name: "", description: "", unit: "", unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  const saveItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return axiosInstance.post("/api/items", data.items).then((res) => res.data)
    },
    onSuccess: (saved) => {
      toast.success("Items saved successfully ✅", {
        description: `${saved.length} item(s) added.`,
      })
      queryClient.invalidateQueries({ queryKey: ["itemsList"] })
      onSave(saved)
      setFormState({ type: null })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        "Failed to save items. Please try again."
      toast.error("Save failed ❌", { description: message })
    },
  })

  useEffect(() => {
    if (formState.type?.includes("edit") && formState.data) {
      reset({ items: [formState.data] })
    } else if (formState.type === "add-item") {
      reset({ items: [{ name: "", description: "", unit: "", unitPrice: 0 }] })
    }
  }, [formState, reset])

  if (!formState.type?.includes("item")) return null

  return (
    <div className="fixed inset-0 bg-blue-100/30 backdrop-blur-sm flex items-center justify-center z-50 px-4 sm:px-0">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl border border-blue-200">
        <h2 className="text-2xl font-semibold mb-6 text-blue-700 text-center">
          {formState.type === "add-item" ? "Add Items" : "Edit Item"}
        </h2>

        <form onSubmit={handleSubmit((data) => saveItemMutation.mutate(data))} className="space-y-6">
          <div className="max-h-[60vh] overflow-y-auto border border-blue-100 rounded-xl p-4 bg-blue-50/20">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 border border-blue-200 rounded-xl bg-white shadow-sm relative"
              >
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Name *</label>
                  <input
                    {...register(`items.${index}.name`)}
                    placeholder="Name"
                    className="border border-blue-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.items?.[index]?.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.items[index]?.name?.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Description *</label>
                  <input
                    {...register(`items.${index}.description`)}
                    placeholder="Description"
                    className="border border-blue-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.items[index]?.description?.message}</p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Unit *</label>
                  <input
                    {...register(`items.${index}.unit`)}
                    placeholder="Unit (e.g., pcs, kg)"
                    className="border border-blue-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.items?.[index]?.unit && (
                    <p className="text-red-500 text-xs mt-1">{errors.items[index]?.unit?.message}</p>
                  )}
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Unit Price *</label>
                  <input
                    type="number"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    placeholder="Unit Price"
                    className="border border-blue-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.items?.[index]?.unitPrice && (
                    <p className="text-red-500 text-xs mt-1">{errors.items[index]?.unitPrice?.message}</p>
                  )}
                </div>

                {/* Remove Button */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute -top-3 -right-3 bg-red-500 text-white text-xs rounded-full w-6 h-6 hover:bg-red-600 shadow-md"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => append({ name: "", description: "", unit: "", unitPrice: 0 })}
              className="px-5 py-2 border border-blue-400 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-all"
            >
              + Add Another Item
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormState({ type: null })}
                className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                disabled={saveItemMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all disabled:opacity-50"
                disabled={saveItemMutation.isPending}
              >
                {saveItemMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
