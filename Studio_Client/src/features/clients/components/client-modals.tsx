
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

interface Client {
  _id: string
  clientId: string
  companyName: string
  clientType: string
  primaryContact: string
  contactTitle?: string
  email: string
  phone: string
  address?: string
  city: string
  state: string
  zipCode?: string
  industry?: string
  taxId?: string
  notes?: string
}

interface ClientModalsProps {
  client: Client
  modalType: "view" | "edit" | "delete" | null
  onClose: () => void
  onConfirmDelete: () => void
  isDeleting: boolean
}

export function ClientModals({ client, modalType, onClose, onConfirmDelete, isDeleting }: ClientModalsProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(client)

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Client>) => axiosInstance.put(`/clients/${client._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
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

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  return (
    <>
      {/* View Modal */}
      <Dialog open={modalType === "view"} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>View complete information for {client.companyName}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Client ID</Label>
              <p className="font-medium">{client.clientId}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Company Name</Label>
              <p className="font-medium">{client.companyName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Client Type</Label>
              <p className="font-medium">{client.clientType}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Industry</Label>
              <p className="font-medium">{client.industry || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Primary Contact</Label>
              <p className="font-medium">{client.primaryContact}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contact Title</Label>
              <p className="font-medium">{client.contactTitle || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium">{client.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <p className="font-medium">{client.phone}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Address</Label>
              <p className="font-medium">{client.address || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">City</Label>
              <p className="font-medium">{client.city}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">State</Label>
              <p className="font-medium">{client.state}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Zip Code</Label>
              <p className="font-medium">{client.zipCode || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tax ID</Label>
              <p className="font-medium">{client.taxId || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <p className="font-medium">{client.notes || "N/A"}</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={modalType === "edit"} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update information for {client.companyName}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="clientType">Client Type</Label>
              <Input id="clientType" name="clientType" value={formData.clientType} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="primaryContact">Primary Contact</Label>
              <Input
                id="primaryContact"
                name="primaryContact"
                value={formData.primaryContact}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="contactTitle">Contact Title</Label>
              <Input
                id="contactTitle"
                name="contactTitle"
                value={formData.contactTitle || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address || ""} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input id="zipCode" name="zipCode" value={formData.zipCode || ""} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" value={formData.industry || ""} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input id="taxId" name="taxId" value={formData.taxId || ""} onChange={handleInputChange} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes || ""} onChange={handleInputChange} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={modalType === "delete"} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {client.companyName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
