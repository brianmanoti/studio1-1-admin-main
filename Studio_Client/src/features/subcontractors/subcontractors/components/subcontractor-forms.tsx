import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Plus, Trash } from "lucide-react"

const projectSchema = z.object({
  estimateId: z.string().nonempty(),
  allocatedBudget: z.number().min(0),
  totalWages: z.number().min(0),
  totalExpenses: z.number().min(0),
  totalPOS: z.number().min(0),
  balance: z.number().min(0),
  progress: z.number().min(0).max(100),
})

const paymentSchema = z.object({
  amount: z.number().min(0),
  description: z.string().optional(),
  reference: z.string().optional(),
})

const formSchema = z.object({
  companyName: z.string().nonempty("Company name is required"),
  contactPerson: z.string().nonempty("Contact person is required"),
  phoneNumber: z.string().nonempty("Phone number is required"),
  email: z.string().email("Invalid email address"),
  typeOfWork: z.string().nonempty("Type of work is required"),
  status: z.enum(["pending", "approved", "declined"]),
  projects: z.array(projectSchema),
  payments: z.array(paymentSchema),
})

type FormData = z.infer<typeof formSchema>

export default function SubcontractorForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "pending",
      projects: [],
      payments: [],
    },
  })

  const { control, register, handleSubmit, watch } = form

  const { fields: projectFields, append: addProject, remove: removeProject } = useFieldArray({
    control,
    name: "projects",
  })

  const { fields: paymentFields, append: addPayment, remove: removePayment } = useFieldArray({
    control,
    name: "payments",
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Subcontractor Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Company Name</Label>
            <Input {...register("companyName")} placeholder="Enter company name" />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input {...register("contactPerson")} placeholder="Enter contact person" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input {...register("phoneNumber")} placeholder="Enter phone number" />
          </div>
          <div>
            <Label>Email</Label>
            <Input {...register("email")} placeholder="Enter email" />
          </div>
          <div>
            <Label>Type of Work</Label>
            <Input {...register("typeOfWork")} placeholder="e.g. Plumbing, Electrical..." />
          </div>
          <div>
            <Label>Status</Label>
            <Select onValueChange={(v) => form.setValue("status", v as any)} defaultValue={watch("status")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card className="p-6 shadow-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Projects</CardTitle>
          <Button type="button" variant="outline" onClick={() => addProject({
            estimateId: "",
            allocatedBudget: 0,
            totalWages: 0,
            totalExpenses: 0,
            totalPOS: 0,
            balance: 0,
            progress: 0,
          })}>
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectFields.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Estimate ID</Label>
                <Input {...register(`projects.${index}.estimateId`)} placeholder="Estimate ID" />
              </div>
              <div>
                <Label>Allocated Budget</Label>
                <Input type="number" {...register(`projects.${index}.allocatedBudget`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input type="number" {...register(`projects.${index}.progress`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Total Wages</Label>
                <Input type="number" {...register(`projects.${index}.totalWages`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Total Expenses</Label>
                <Input type="number" {...register(`projects.${index}.totalExpenses`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Total POS</Label>
                <Input type="number" {...register(`projects.${index}.totalPOS`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Balance</Label>
                <Input type="number" {...register(`projects.${index}.balance`, { valueAsNumber: true })} />
              </div>
              <Button type="button" variant="destructive" onClick={() => removeProject(index)}>
                <Trash className="w-4 h-4 mr-2" /> Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card className="p-6 shadow-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Payments</CardTitle>
          <Button type="button" variant="outline" onClick={() => addPayment({ amount: 0, description: "", reference: "" })}>
            <Plus className="w-4 h-4 mr-2" /> Add Payment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentFields.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Amount</Label>
                <Input type="number" {...register(`payments.${index}.amount`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input {...register(`payments.${index}.description`)} />
              </div>
              <div>
                <Label>Reference</Label>
                <Input {...register(`payments.${index}.reference`)} />
              </div>
              <Button type="button" variant="destructive" onClick={() => removePayment(index)}>
                <Trash className="w-4 h-4 mr-2" /> Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="px-6">Submit</Button>
      </div>
    </form>
  )
}
