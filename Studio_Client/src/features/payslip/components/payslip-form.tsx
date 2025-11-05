"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import axiosInstance from "@/lib/axios"
import { toast } from "sonner"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ArrowLeft, Trash2, Plus } from "lucide-react"

import EstimateSelector from "@/features/estimates/estimates/components/estimate-selector"

// ✅ Validation Schema
const deductionSchema = z.object({
  name: z.string().min(1, "Deduction name is required"),
  value: z.coerce.number().min(0, "Value must be 0 or greater"),
})

const payslipSchema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  date: z.string().min(1, "Date is required"),
  grossPay: z.coerce.number().min(0, "Gross pay must be 0 or greater"),
  allowanceDeductions: z.coerce.number().default(0),
  personalRelief: z.coerce.number().default(0),
  preparedBy: z.string().min(1, "Prepared By is required"),
  projectId: z.string().optional(),
  estimateId: z.string().optional(),
  estimateLevel: z.enum(["estimate", "group", "section", "subsection"]).optional(),
  estimateTargetId: z.string().optional(),
  status: z.enum(["draft", "approved", "declined"]).default("draft"),
  customDeductions: z.array(deductionSchema).default([]),
})

type PayslipFormValues = z.infer<typeof payslipSchema>

// ✅ Mutation Hook
function useCreatePayslip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: PayslipFormValues) => {
      const res = await axiosInstance.post("/api/pay-slip", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslip"] })
    },
  })
}

// ✅ Fetch project list
const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/projects")
      return res.data
    },
  })

export default function PayslipForm() {
  const router = useRouter()
  const mutation = useCreatePayslip()
  const { data: projects } = useProjects()
  const [linkToEstimate, setLinkToEstimate] = useState(false)

  const form = useForm<PayslipFormValues>({
    resolver: zodResolver(payslipSchema),
    defaultValues: {
      employeeName: "",
      date: "",
      grossPay: 0,
      allowanceDeductions: 0,
      personalRelief: 0,
      preparedBy: "",
      status: "draft",
      customDeductions: [],
    },
  })

  // ✅ Added useFieldArray for managing custom deductions
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customDeductions",
  })

  const handleSubmit = (status: "draft" | "approved") => {
    form.handleSubmit((data) => {
      mutation.mutate(
        { ...data, status },
        {
          onSuccess: () => {
            toast.success(status === "draft" ? "Draft saved successfully" : "Payslip created successfully")
            form.reset()
            router.navigate({ to: "/projects/$projectId/payslip/" })
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Error creating payslip")
          },
        },
      )
    })()
  }

  const handleEstimateChange = (value: {
    estimateId: string
    estimateLevel: "estimate" | "group" | "section" | "subsection"
    estimateTargetId: string | null
  }) => {
    form.setValue("estimateId", value.estimateId)
    form.setValue("estimateLevel", value.estimateLevel)
    form.setValue("estimateTargetId", value.estimateTargetId ?? "")
  }

  const FormField = ({ label, name, type = "text", step, required = true, placeholder }: any) => {
    const error = form.formState.errors[name as keyof PayslipFormValues]
    return (
      <div>
        <Label className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          type={type}
          step={step}
          placeholder={placeholder}
          {...form.register(name)}
          className={error ? "border-red-500" : ""}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
      </div>
    )
  }

  // ✅ Calculate total deductions for display
  const totalDeductions = fields.reduce((sum, field) => {
    const value = form.getValues(`customDeductions.${fields.indexOf(field)}.value`)
    return sum + (value || 0)
  }, 0)

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="w-full mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.history.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Create Payslip</h2>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Payslip Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* RADIO TOGGLE */}
            <div>
              <Label className="mb-3 block font-medium">Link Type</Label>
              <RadioGroup
                defaultValue="project"
                onValueChange={(value) => setLinkToEstimate(value === "estimate")}
                className="flex flex-col sm:flex-row gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="project" id="project" />
                  <Label htmlFor="project" className="font-normal cursor-pointer">
                    Standard Project Payslip
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="estimate" id="estimate" />
                  <Label htmlFor="estimate" className="font-normal cursor-pointer">
                    Attach to Estimate
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* CONDITIONAL ESTIMATE SELECTOR */}
            {linkToEstimate && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Select Estimate and Level</h4>
                <EstimateSelector onChange={handleEstimateChange} />
              </div>
            )}

            {/* FORM FIELDS */}
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Employee Name" name="employeeName" />
                <FormField label="Date" name="date" type="date" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Gross Pay" name="grossPay" type="number" step="0.01" />
                <FormField
                  label="Allowance / Deductions"
                  name="allowanceDeductions"
                  type="number"
                  step="0.01"
                  required={false}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Personal Relief" name="personalRelief" type="number" step="0.01" required={false} />
                <FormField label="Prepared By" name="preparedBy" />
              </div>

              {!linkToEstimate && (
                <div>
                  <Label className="flex items-center gap-1">
                    Project
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(val) => form.setValue("projectId", val)}>
                    <SelectTrigger className={form.formState.errors.projectId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((p: any) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.projectId && <p className="text-sm text-red-500 mt-1">Project is required</p>}
                </div>
              )}

              {/* ✅ Added custom deductions section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Custom Deductions</h3>
                    <p className="text-sm text-gray-600 mt-1">Add custom deduction items for this payslip</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", value: 0 })}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Deduction
                  </Button>
                </div>

                {/* Deductions List */}
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="flex-1 w-full">
                        <Label className="text-sm mb-2 block">Deduction Name</Label>
                        <Input
                          placeholder="e.g., Tax, Insurance, Loan"
                          {...form.register(`customDeductions.${index}.name`)}
                          className={form.formState.errors.customDeductions?.[index]?.name ? "border-red-500" : ""}
                        />
                        {form.formState.errors.customDeductions?.[index]?.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.customDeductions[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div className="flex-1 w-full">
                        <Label className="text-sm mb-2 block">Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...form.register(`customDeductions.${index}.value`)}
                          className={form.formState.errors.customDeductions?.[index]?.value ? "border-red-500" : ""}
                        />
                        {form.formState.errors.customDeductions?.[index]?.value && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.customDeductions[index]?.value?.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                        aria-label="Remove deduction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <p className="text-sm text-gray-500 py-4 text-center">No custom deductions added yet</p>
                  )}
                </div>

                {/* Total Deductions Summary */}
                {fields.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-blue-900">Total Deductions:</span>
                    <span className="text-lg font-semibold text-blue-900">${totalDeductions.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => handleSubmit("draft")}
                  className="w-full sm:w-auto"
                >
                  {mutation.isPending ? "Saving..." : "Save as Draft"}
                </Button>

                <Button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => handleSubmit("approved")}
                  className="w-full sm:w-auto"
                >
                  {mutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
