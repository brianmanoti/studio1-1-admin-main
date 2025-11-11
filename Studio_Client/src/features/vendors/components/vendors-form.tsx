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
import { useCreateVendor, useUpdateVendor } from "@/hooks/use-vendors"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"

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
  defaultValues,
}: {
  defaultValues?: Partial<VendorFormData> & { _id?: string }
}) {
  const navigate = useNavigate()
  const { mutate: createVendor, isPending: creating } = useCreateVendor()
  const { mutate: updateVendor, isPending: updating } = useUpdateVendor()

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: defaultValues || { status: "Active" },
  })

  const { register, handleSubmit, formState, setValue, watch } = form
  const { errors } = formState

  const onSubmit = (data: VendorFormData) => {
    const isEdit = !!defaultValues?._id
    const mutation = isEdit ? updateVendor : createVendor

    mutation(
      isEdit ? { id: defaultValues!._id!, payload: data } : data,
      {
        onSuccess: async () => {
          toast.success(`Vendor ${isEdit ? "updated" : "created"} successfully`)
          await navigate({ to: "/projects/$projectId/Vendors" }) // ✅ Redirect using TanStack Router
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message ||
            "Something went wrong while saving the vendor"
          toast.error(message)
        },
      }
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-6"
    >
      <Card className="w-full p-6 shadow-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            {defaultValues ? "Edit Vendor" : "Add New Vendor"}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/projects/$projectId/Vendors" })} // 
          >
            Back
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Company Info */}
          <div>
            <Label>Company Name</Label>
            <Input {...register("companyName")} placeholder="Enter company name" />
            {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName.message}</p>}
          </div>

          <div>
            <Label>Category</Label>
            <Input {...register("category")} placeholder="e.g. Electrical, Plumbing" />
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>

          <div>
            <Label>Contact Person</Label>
            <Input {...register("contactPerson")} placeholder="Enter contact person" />
            {errors.contactPerson && <p className="text-red-500 text-sm">{errors.contactPerson.message}</p>}
          </div>

          {/* Contact Info */}
          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email")} placeholder="Enter email" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} placeholder="Enter phone number" />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          </div>

          <div>
            <Label>Website</Label>
            <Input {...register("website")} placeholder="https://example.com" />
          </div>

          {/* Address */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Address</Label>
            <Input {...register("address")} placeholder="Enter full address" />
            {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
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
            {errors.paymentTerms && <p className="text-red-500 text-sm">{errors.paymentTerms.message}</p>}
          </div>

          {/* Status */}
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

          {/* Notes */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Additional comments or internal notes" rows={3} />
          </div>
        </CardContent>

        <div className="flex justify-end mt-6 space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/projects/$projectId/Vendors" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={creating || updating} className="px-6">
            {creating || updating ? "Saving..." : "Save Vendor"}
          </Button>
        </div>
      </Card>
    </form>
  )
}
