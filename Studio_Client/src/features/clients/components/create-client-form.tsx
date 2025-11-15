
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import axiosInstance from "@/lib/axios"

interface CreateClientFormProps {
  open: boolean
  onClose: () => void
}

const initialFormData = {
  companyName: "",
  clientType: "",
  primaryContact: "",
  contactTitle: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  industry: "",
  taxId: "",
  notes: "",
}

export function CreateClientForm({ open, onClose }: CreateClientFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(initialFormData)

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof initialFormData) => axiosInstance.post("/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setFormData(initialFormData)
      onClose()
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = () => {
    createMutation.mutate(formData)
  }

  const handleClose = () => {
    setFormData(initialFormData)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>Add a new client to your system</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <div>
            <Label htmlFor="companyName">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Enter company name"
            />
          </div>
          <div>
            <Label htmlFor="clientType">
              Client Type <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientType"
              name="clientType"
              value={formData.clientType}
              onChange={handleInputChange}
              placeholder="e.g., Enterprise, SMB"
            />
          </div>
          <div>
            <Label htmlFor="primaryContact">
              Primary Contact <span className="text-red-500">*</span>
            </Label>
            <Input
              id="primaryContact"
              name="primaryContact"
              value={formData.primaryContact}
              onChange={handleInputChange}
              placeholder="Contact person name"
            />
          </div>
          <div>
            <Label htmlFor="contactTitle">Contact Title</Label>
            <Input
              id="contactTitle"
              name="contactTitle"
              value={formData.contactTitle}
              onChange={handleInputChange}
              placeholder="e.g., Manager, Director"
            />
          </div>
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Street address"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" />
          </div>
          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              placeholder="12345"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Finance"
            />
          </div>
          <div>
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" name="taxId" value={formData.taxId} onChange={handleInputChange} placeholder="Tax ID" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes about the client"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
