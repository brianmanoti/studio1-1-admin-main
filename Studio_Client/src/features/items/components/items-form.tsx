import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

// ✅ Validation Schema
const itemSchema = z.object({
  description: z.string().nonempty("Description is required"),
  unit: z.string().nonempty("Unit is required"),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
})

type ItemFormData = z.infer<typeof itemSchema>

export default function ItemForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: ItemFormData) => void
  defaultValues?: Partial<ItemFormData>
}) {
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultValues || {
      description: "",
      unit: "",
      unitPrice: 0,
    },
  })

  const { register, handleSubmit, formState } = form
  const { errors, isSubmitting } = formState

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
      <Card className="p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {defaultValues ? "Edit Item" : "Create Item"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Enter item description"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" {...register("unit")} placeholder="e.g. pcs, m², kg" />
              {errors.unit && (
                <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
              )}
            </div>

            {/* Unit Price */}
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                {...register("unitPrice", { valueAsNumber: true })}
                placeholder="Enter price"
              />
              {errors.unitPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.unitPrice.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
