import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

const vendorSchema = z.object({
  companyName: z.string().nonempty("Company name is required"),
  category: z.string().nonempty("Category is required"),
  contactPerson: z.string().nonempty("Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().nonempty("Phone number is required"),
  website: z.string().optional(),
  address: z.string().nonempty("Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().nonempty("Payment terms are required"),
  notes: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
})

type VendorFormData = z.infer<typeof vendorSchema>

export default function VendorForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: VendorFormData) => void
  defaultValues?: Partial<VendorFormData>
}) {
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: defaultValues || {
      status: "Active",
    },
  })

  const { register, handleSubmit, formState, setValue, watch } = form
  const { errors, isSubmitting } = formState

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      <Card className="p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {defaultValues ? "Edit Vendor" : "Add New Vendor"}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Info */}
          <div>
            <Label>Company Name</Label>
            <Input {...register("companyName")} placeholder="Enter company name" />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <Label>Category</Label>
            <Input {...register("category")} placeholder="e.g. Electrical, Plumbing" />
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <Label>Contact Person</Label>
            <Input {...register("contactPerson")} placeholder="Enter contact person" />
            {errors.contactPerson && (
              <p className="text-red-500 text-sm mt-1">{errors.contactPerson.message}</p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email")} placeholder="Enter email" />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} placeholder="Enter phone number" />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label>Website</Label>
            <Input {...register("website")} placeholder="https://example.com" />
          </div>

          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input {...register("address")} placeholder="Enter full address" />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <Label>City</Label>
            <Input {...register("city")} placeholder="City name" />
          </div>

          <div>
            <Label>State</Label>
            <Input {...register("state")} placeholder="State or province" />
          </div>

          <div>
            <Label>Zip Code</Label>
            <Input {...register("zipCode")} placeholder="Postal code" />
          </div>

          <div>
            <Label>Tax ID</Label>
            <Input {...register("taxId")} placeholder="Enter tax ID" />
          </div>

          <div>
            <Label>Payment Terms</Label>
            <Input {...register("paymentTerms")} placeholder="e.g. Net 30, Advance" />
            {errors.paymentTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentTerms.message}</p>
            )}
          </div>

          <div>
            <Label>Status</Label>
            <Select
              onValueChange={(value) => setValue("status", value as "Active" | "Inactive")}
              defaultValue={watch("status")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              {...register("notes")}
              placeholder="Additional comments or internal notes"
              rows={3}
            />
          </div>
        </CardContent>

        <div className="flex justify-end p-6">
          <Button type="submit" disabled={isSubmitting} className="px-6">
            {isSubmitting ? "Saving..." : "Save Vendor"}
          </Button>
        </div>
      </Card>
    </form>
  )
}
