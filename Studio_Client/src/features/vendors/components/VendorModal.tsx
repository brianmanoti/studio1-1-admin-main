import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function VendorModal({ vendor, isOpen, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(vendor || {})

  useEffect(() => {
    setForm(vendor || {})
  }, [vendor])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSave = () => {
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm pointer-events-none"></div>

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 pointer-events-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Vendor</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Company Name</label>
            <Input name="companyName" value={form.companyName || ""} onChange={handleChange} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Category</label>
            <Input name="category" value={form.category || ""} onChange={handleChange} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Contact Person</label>
            <Input name="contactPerson" value={form.contactPerson || ""} onChange={handleChange} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Email</label>
            <Input name="email" value={form.email || ""} onChange={handleChange} type="email" />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Phone</label>
            <Input name="phone" value={form.phone || ""} onChange={handleChange} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Address</label>
            <Input name="address" value={form.address || ""} onChange={handleChange} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Notes</label>
            <Textarea name="notes" value={form.notes || ""} onChange={handleChange} rows={3} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Status</label>
            <Select value={form.status || "Active"} onValueChange={(val) => setForm({ ...form, status: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
