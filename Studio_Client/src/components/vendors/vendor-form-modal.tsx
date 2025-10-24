import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useItemsVendors } from "@/hooks/use-items-vendors"
import axiosInstance from "@/lib/axios"

interface VendorFormModalProps {
  onSave: (vendor: any) => void
}

export function VendorFormModal({ onSave }: VendorFormModalProps) {
  const { formState, setFormState } = useItemsVendors()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
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
  })

  const saveVendorMutation = useMutation({
    mutationFn: async (vendor: any) => {
      if (vendor._id) {
        return axiosInstance.put(`/api/vendors/${vendor._id}`, vendor).then((res) => res.data)
      }
      return axiosInstance.post("/api/vendors", vendor).then((res) => res.data)
    },
    onSuccess: (savedVendor) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      onSave(savedVendor)
      setFormState({ type: null })
    },
    onError: (error) => {
      console.error("Failed to save vendor:", error)
      alert("Failed to save vendor. Please try again.")
    },
  })

  useEffect(() => {
    if (formState.type?.includes("edit") && formState.data) {
      setFormData(formState.data)
    } else if (formState.type === "add-vendor") {
      setFormData({
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
      })
    }
  }, [formState])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert("Company name, email, and phone are required.")
      return
    }
    saveVendorMutation.mutate(formData)
  }

  if (!formState.type?.includes("vendor")) return null

  return (
    <div className="fixed inset-0 bg-blue-50/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-blue-200 rounded-xl shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6 border-b pb-2">
          {formState.type === "add-vendor" ? "Add Vendor" : "Edit Vendor"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Enter company name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="e.g., Construction, Supplies"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
            <input
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="vendor@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="+254712345678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="https://example.com"
            />
          </div>

          {/* Address Info */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="123 Vendor Street"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Nairobi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Kiambu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
            <input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="00100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
            <input
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="PIN or VAT ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms *</label>
            <input
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Net 30, COD, etc."
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 md:col-span-2 mt-6">
            <button
              type="button"
              onClick={() => setFormState({ type: null })}
              className="px-4 py-2 border border-blue-400 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
              disabled={saveVendorMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={saveVendorMutation.isPending}
            >
              {saveVendorMutation.isPending ? "Saving..." : "Save Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
