import { useState } from "react"
import { useCreateSubcontractor, useUpdateSubcontractor, type Subcontractor } from "@/hooks/use-subcontractors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SubcontractorFormProps {
  subcontractor?: Subcontractor
  onSuccess?: () => void
}

interface Project {
  projectId: string
  estimateId: string
  allocationLevel: "group" | "section" | "subsection"
  allocationRef: string
  allocationModel: "Group" | "Section" | "Subsection"
  allocatedBudget: number
  totalWages: number
  totalExpenses: number
  totalPOS: number
  progress: number
}

interface Payment {
  amount: number
  date: string
  description: string
  reference: string
}

export function SubcontractorForm({ subcontractor, onSuccess }: SubcontractorFormProps) {
  const [formData, setFormData] = useState({
    companyName: subcontractor?.companyName || "",
    contactPerson: subcontractor?.contactPerson || "",
    phoneNumber: subcontractor?.phoneNumber || "",
    email: subcontractor?.email || "",
    typeOfWork: subcontractor?.typeOfWork || "",
    status: subcontractor?.status || "pending",
    projects: (subcontractor?.projects as Project[]) || [],
    payments: (subcontractor?.payments as Payment[]) || [],
  })

  const [newProject, setNewProject] = useState<Project>({
    projectId: "",
    estimateId: "",
    allocationLevel: "group",
    allocationRef: "",
    allocationModel: "Group",
    allocatedBudget: 0,
    totalWages: 0,
    totalExpenses: 0,
    totalPOS: 0,
    progress: 0,
  })

  const [newPayment, setNewPayment] = useState<Payment>({
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: "",
  })

  const createMutation = useCreateSubcontractor()
  const updateMutation = useUpdateSubcontractor()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const handleAddProject = () => {
    if (newProject.projectId && newProject.estimateId) {
      setFormData({
        ...formData,
        projects: [...formData.projects, newProject],
      })
      setNewProject({
        projectId: "",
        estimateId: "",
        allocationLevel: "group",
        allocationRef: "",
        allocationModel: "Group",
        allocatedBudget: 0,
        totalWages: 0,
        totalExpenses: 0,
        totalPOS: 0,
        progress: 0,
      })
    }
  }

  const handleRemoveProject = (index: number) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index),
    })
  }

  const handleAddPayment = () => {
    if (newPayment.amount > 0) {
      setFormData({
        ...formData,
        payments: [...formData.payments, newPayment],
      })
      setNewPayment({
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        reference: "",
      })
    }
  }

  const handleRemovePayment = (index: number) => {
    setFormData({
      ...formData,
      payments: formData.payments.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (subcontractor?._id) {
        await updateMutation.mutateAsync({
          id: subcontractor._id,
          data: formData,
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      onSuccess?.()
    } catch (error) {
      console.error("[v0] Form submission error:", error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="typeOfWork">Type of Work</Label>
            <Input
              id="typeOfWork"
              value={formData.typeOfWork}
              onChange={(e) => setFormData({ ...formData, typeOfWork: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as any })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Projects</h3>

        {formData.projects.length > 0 && (
          <div className="space-y-2">
            {formData.projects.map((project, index) => (
              <Card key={index} className="bg-slate-50">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Project ID: {project.projectId}</p>
                      <p className="text-xs text-gray-600">Estimate: {project.estimateId}</p>
                      <p className="text-xs text-gray-600">
                        Budget: KES {project.allocatedBudget.toLocaleString("en-KE")}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveProject(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="projectId" className="text-xs">
                  Project ID
                </Label>
                <Input
                  id="projectId"
                  value={newProject.projectId}
                  onChange={(e) => setNewProject({ ...newProject, projectId: e.target.value })}
                  placeholder="Enter project ID"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="estimateId" className="text-xs">
                  Estimate ID
                </Label>
                <Input
                  id="estimateId"
                  value={newProject.estimateId}
                  onChange={(e) => setNewProject({ ...newProject, estimateId: e.target.value })}
                  placeholder="Enter estimate ID"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="allocationLevel" className="text-xs">
                  Allocation Level
                </Label>
                <Select
                  value={newProject.allocationLevel}
                  onValueChange={(value) => setNewProject({ ...newProject, allocationLevel: value as any })}
                >
                  <SelectTrigger id="allocationLevel" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="subsection">Subsection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="allocationModel" className="text-xs">
                  Allocation Model
                </Label>
                <Select
                  value={newProject.allocationModel}
                  onValueChange={(value) => setNewProject({ ...newProject, allocationModel: value as any })}
                >
                  <SelectTrigger id="allocationModel" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Group">Group</SelectItem>
                    <SelectItem value="Section">Section</SelectItem>
                    <SelectItem value="Subsection">Subsection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="allocationRef" className="text-xs">
                Allocation Reference
              </Label>
              <Input
                id="allocationRef"
                value={newProject.allocationRef}
                onChange={(e) => setNewProject({ ...newProject, allocationRef: e.target.value })}
                placeholder="Enter allocation reference"
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="allocatedBudget" className="text-xs">
                  Allocated Budget (KES)
                </Label>
                <Input
                  id="allocatedBudget"
                  type="number"
                  value={newProject.allocatedBudget}
                  onChange={(e) =>
                    setNewProject({ ...newProject, allocatedBudget: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="progress" className="text-xs">
                  Progress (%)
                </Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={newProject.progress}
                  onChange={(e) => setNewProject({ ...newProject, progress: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="totalWages" className="text-xs">
                  Total Wages (KES)
                </Label>
                <Input
                  id="totalWages"
                  type="number"
                  value={newProject.totalWages}
                  onChange={(e) => setNewProject({ ...newProject, totalWages: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="totalExpenses" className="text-xs">
                  Total Expenses (KES)
                </Label>
                <Input
                  id="totalExpenses"
                  type="number"
                  value={newProject.totalExpenses}
                  onChange={(e) =>
                    setNewProject({ ...newProject, totalExpenses: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="totalPOS" className="text-xs">
                  Total POS (KES)
                </Label>
                <Input
                  id="totalPOS"
                  type="number"
                  value={newProject.totalPOS}
                  onChange={(e) => setNewProject({ ...newProject, totalPOS: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddProject}
              variant="outline"
              className="w-full text-sm bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Payments</h3>

        {formData.payments.length > 0 && (
          <div className="space-y-2">
            {formData.payments.map((payment, index) => (
              <Card key={index} className="bg-slate-50">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">KES {payment.amount.toLocaleString("en-KE")}</p>
                      <p className="text-xs text-gray-600">
                        Date: {new Date(payment.date).toLocaleDateString("en-KE")}
                      </p>
                      {payment.description && (
                        <p className="text-xs text-gray-600">Description: {payment.description}</p>
                      )}
                      {payment.reference && <p className="text-xs text-gray-600">Reference: {payment.reference}</p>}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePayment(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add New Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="paymentAmount" className="text-xs">
                  Amount (KES)
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="paymentDate" className="text-xs">
                  Date
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="paymentDescription" className="text-xs">
                Description
              </Label>
              <Input
                id="paymentDescription"
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder="Payment description"
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="paymentReference" className="text-xs">
                Reference
              </Label>
              <Input
                id="paymentReference"
                value={newPayment.reference}
                onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                placeholder="Payment reference"
                className="text-sm"
              />
            </div>

            <Button
              type="button"
              onClick={handleAddPayment}
              variant="outline"
              className="w-full text-sm bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </CardContent>
        </Card>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {subcontractor ? "Update Subcontractor" : "Create Subcontractor"}
      </Button>
    </form>
  )
}
