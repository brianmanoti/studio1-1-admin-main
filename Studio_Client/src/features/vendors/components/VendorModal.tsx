import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VendorModal({ vendor, isOpen, onClose, onSave }) {
  const [form, setForm] = useState(vendor || {});

  useEffect(() => {
    setForm(vendor || {});
  }, [vendor]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      {/* Blurred background (not clickable) */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm pointer-events-none"></div>

      {/* Modal container (clickable) */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 pointer-events-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Vendor</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="flex flex-col">
            <label htmlFor="companyName" className="mb-1 text-gray-700 font-medium">
              Company Name
            </label>
            <Input
              id="companyName"
              name="companyName"
              value={form.companyName || ""}
              onChange={handleChange}
              placeholder="Enter company name"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col">
            <label htmlFor="category" className="mb-1 text-gray-700 font-medium">
              Category
            </label>
            <Input
              id="category"
              name="category"
              value={form.category || ""}
              onChange={handleChange}
              placeholder="Enter category"
            />
          </div>

          {/* Contact Person */}
          <div className="flex flex-col">
            <label htmlFor="contactPerson" className="mb-1 text-gray-700 font-medium">
              Contact Person
            </label>
            <Input
              id="contactPerson"
              name="contactPerson"
              value={form.contactPerson || ""}
              onChange={handleChange}
              placeholder="Enter contact person"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 text-gray-700 font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              placeholder="Enter email"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label htmlFor="phone" className="mb-1 text-gray-700 font-medium">
              Phone
            </label>
            <Input
              id="phone"
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          {/* Website */}
          <div className="flex flex-col">
            <label htmlFor="website" className="mb-1 text-gray-700 font-medium">
              Website
            </label>
            <Input
              id="website"
              name="website"
              value={form.website || ""}
              onChange={handleChange}
              placeholder="Enter website URL"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col">
            <label htmlFor="address" className="mb-1 text-gray-700 font-medium">
              Address
            </label>
            <Input
              id="address"
              name="address"
              value={form.address || ""}
              onChange={handleChange}
              placeholder="Enter address"
            />
          </div>

          {/* City */}
          <div className="flex flex-col">
            <label htmlFor="city" className="mb-1 text-gray-700 font-medium">
              City
            </label>
            <Input
              id="city"
              name="city"
              value={form.city || ""}
              onChange={handleChange}
              placeholder="Enter city"
            />
          </div>

          {/* State */}
          <div className="flex flex-col">
            <label htmlFor="state" className="mb-1 text-gray-700 font-medium">
              State
            </label>
            <Input
              id="state"
              name="state"
              value={form.state || ""}
              onChange={handleChange}
              placeholder="Enter state"
            />
          </div>

          {/* Zip Code */}
          <div className="flex flex-col">
            <label htmlFor="zipCode" className="mb-1 text-gray-700 font-medium">
              Zip Code
            </label>
            <Input
              id="zipCode"
              name="zipCode"
              value={form.zipCode || ""}
              onChange={handleChange}
              placeholder="Enter zip code"
            />
          </div>

          {/* Tax ID */}
          <div className="flex flex-col">
            <label htmlFor="taxId" className="mb-1 text-gray-700 font-medium">
              Tax ID
            </label>
            <Input
              id="taxId"
              name="taxId"
              value={form.taxId || ""}
              onChange={handleChange}
              placeholder="Enter tax ID"
            />
          </div>

          {/* Payment Terms */}
          <div className="flex flex-col">
            <label htmlFor="paymentTerms" className="mb-1 text-gray-700 font-medium">
              Payment Terms
            </label>
            <Input
              id="paymentTerms"
              name="paymentTerms"
              value={form.paymentTerms || ""}
              onChange={handleChange}
              placeholder="Enter payment terms"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col">
            <label htmlFor="notes" className="mb-1 text-gray-700 font-medium">
              Notes
            </label>
            <Input
              id="notes"
              name="notes"
              value={form.notes || ""}
              onChange={handleChange}
              placeholder="Additional notes"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label htmlFor="status" className="mb-1 text-gray-700 font-medium">
              Status
            </label>
            <Input
              id="status"
              name="status"
              value={form.status || ""}
              onChange={handleChange}
              placeholder="Active/Inactive"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
