"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useItemsVendors } from "@/hooks/use-items-vendors"
import type { Vendor } from "@/contexts/items-vendors-context"

// ✅ Zod Schema (matches Vendor model)
const vendorSchema = z.object({
  companyName: z.string().min(2, { message: "Company name is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  contactPerson: z.string().min(2, { message: "Contact person is required" }),
  email: z.string().email({ message: "Enter a valid email" }),
  phone: z.string().min(7, { message: "Phone number is required" }),
  website: z.string().optional(),
  address: z.string().min(3, { message: "Address is required" }),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().min(2, { message: "Payment terms are required" }),
  notes: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
})

type VendorFormData = z.infer<typeof vendorSchema>

export function VendorForm() {
  const { formState, setFormState, addVendor, updateVendor } = useItemsVendors()
  const isOpen = formState.type === "add-vendor" || formState.type === "edit-vendor"
  const isEdit = formState.type === "edit-vendor"

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      companyName: "",
      category: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      taxId: "",
      paymentTerms: "",
      notes: "",
      status: "Active",
    },
  })

  useEffect(() => {
    if (isEdit && formState.data) {
      reset(formState.data as VendorFormData)
    } else {
      reset()
    }
  }, [isOpen, formState.data, isEdit, reset])

  const onSubmit = (data: VendorFormData) => {
    const vendorData: Vendor = {
      id: isEdit ? (formState.data as Vendor).id : Date.now().toString(),
      ...data,
    }

    if (isEdit) {
      updateVendor((formState.data as Vendor).id, vendorData)
    } else {
      addVendor(vendorData)
    }
    setFormState({ type: null })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setFormState({ type: null })}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {isEdit ? "Edit Vendor" : "Add Vendor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Grouped fields for better UX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Info */}
            <FormField label="Company Name" error={errors.companyName?.message}>
              <Input {...register("companyName")} placeholder="Enter company name" />
            </FormField>

            <FormField label="Category" error={errors.category?.message}>
              <Input {...register("category")} placeholder="Enter category" />
            </FormField>

            <FormField label="Contact Person" error={errors.contactPerson?.message}>
              <Input {...register("contactPerson")} placeholder="Enter contact person" />
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} placeholder="Enter email address" />
            </FormField>

            <FormField label="Phone" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="Enter phone number" />
            </FormField>

            <FormField label="Website">
              <Input {...register("website")} placeholder="Enter website (optional)" />
            </FormField>
          </div>

          {/* Address Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Address" error={errors.address?.message}>
              <Input {...register("address")} placeholder="Enter address" />
            </FormField>

            <FormField label="City">
              <Input {...register("city")} placeholder="Enter city" />
            </FormField>

            <FormField label="State">
              <Input {...register("state")} placeholder="Enter state" />
            </FormField>

            <FormField label="Zip Code">
              <Input {...register("zipCode")} placeholder="Enter zip code" />
            </FormField>

            <FormField label="Tax ID">
              <Input {...register("taxId")} placeholder="Enter tax ID" />
            </FormField>

            <FormField label="Payment Terms" error={errors.paymentTerms?.message}>
              <Input {...register("paymentTerms")} placeholder="e.g., Net 30" />
            </FormField>
          </div>

          {/* Notes + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Status">
              <select
                {...register("status")}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>

            <FormField label="Notes">
              <Input {...register("notes")} placeholder="Additional notes" />
            </FormField>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormState({ type: null })}
              className="px-4"
            >
              Cancel
            </Button>
            <Button type="submit" className="px-6">
              {isEdit ? "Update Vendor" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ✅ Reusable Field Wrapper for cleaner markup
function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
