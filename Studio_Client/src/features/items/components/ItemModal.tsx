import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export function ItemModal({ item, isOpen, onClose, onSubmit }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unit, setUnit] = useState("")
  const [unitPrice, setUnitPrice] = useState("")

  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description)
      setUnit(item.unit)
      setUnitPrice(item.unitPrice)
    } else {
      setName("")
      setDescription("")
      setUnit("")
      setUnitPrice("")
    }
  }, [item, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !description || !unit || unitPrice === "") return

    onSubmit({
      name,
      description,
      unit,
      unitPrice: Number(unitPrice),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <Label>Unit</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} required />
          </div>
          <div>
            <Label>Unit Price</Label>
            <Input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{item ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
