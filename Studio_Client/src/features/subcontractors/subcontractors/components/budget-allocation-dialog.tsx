// components/budget-allocation-dialog.tsx - FIXED VERSION
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, DollarSign } from "lucide-react"
import { useProjects } from "@/hooks/use-projects"
import { type Subcontractor } from "@/hooks/use-subcontractors"
import EstimateSelector from "@/features/estimates/estimates/components/estimate-selector"
import axiosInstance from "@/lib/axios"

// ✅ UPDATED: Remove allocationModel, fix enum values
const allocationSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  estimateId: z.string().min(1, "Estimate is required"), // ✅ Now required
  allocationLevel: z.enum(["group", "section", "subsection"]), // ✅ Removed "estimate"
  allocationRef: z.string().min(1, "Allocation reference is required"),
  //  REMOVED: allocationModel
  allocatedBudget: z.number().min(1, "Budget must be greater than 0"),
})

type AllocationData = z.infer<typeof allocationSchema>

interface BudgetAllocationDialogProps {
  subcontractor: Subcontractor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BudgetAllocationDialog({ subcontractor, open, onOpenChange }: BudgetAllocationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: projects = [], isLoading: projectsLoading } = useProjects()

  const form = useForm<AllocationData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      projectId: "",
      estimateId: "",
      allocationLevel: "group",
      allocationRef: "",
      allocatedBudget: 0,
    },
  })

  const projectOptions = projects.map(project => ({
    value: project._id,
    label: `${project.name} (${project.projectNumber})`,
  }))

  const onSubmit = async (data: AllocationData) => {
    setIsLoading(true)
    try {
      console.log("Submitting budget allocation:", data) // Debug log
      
      // ✅ FIXED: Use correct endpoint and remove allocationModel
      const response = await axiosInstance.post('/api/subcontractors/allocated-budget', {
        subcontractorId: subcontractor._id,
        projectId: data.projectId,
        estimateId: data.estimateId,
        allocatedBudget: data.allocatedBudget,
        allocationLevel: data.allocationLevel,
        allocationRef: data.allocationRef
        //  REMOVED: allocationModel
      })

      console.log("Budget allocation response:", response.data) // Debug log

      if (response.data && response.data.finance) {
        toast.success(`Budget of KES ${data.allocatedBudget.toLocaleString("en-KE")} allocated successfully to ${subcontractor.companyName}`)
        form.reset()
        onOpenChange(false)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error: any) {
      console.error("Budget allocation error:", error)
      
      // Better error message extraction
      let errorMessage = "Failed to allocate budget. Please try again."
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ ADDED: Debug form values
  const watchAllocationRef = form.watch("allocationRef")
  const watchEstimateId = form.watch("estimateId")
  const watchAllocationLevel = form.watch("allocationLevel")

  console.log("Form values:", {
    allocationRef: watchAllocationRef,
    estimateId: watchEstimateId,
    allocationLevel: watchAllocationLevel
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Allocate Budget
          </DialogTitle>
          <DialogDescription>
            Allocate budget to {subcontractor.companyName} for a specific project and estimate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Selection */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select a project"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                      {projectOptions.length === 0 && !projectsLoading && (
                        <SelectItem value="no-projects" disabled>
                          No projects available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimate Selector */}
            <div className="space-y-2">
              <Label>Estimate Allocation *</Label>
              <EstimateSelector
                onChange={(val) => {
                  console.log("EstimateSelector onChange:", val) // Debug log
                  
                  if (val.estimateId && val.estimateTargetId && val.estimateLevel) {
                    form.setValue("estimateId", val.estimateId)
                    form.setValue("allocationLevel", val.estimateLevel as AllocationData["allocationLevel"])
                    form.setValue("allocationRef", val.estimateTargetId)
                    
                    // Show success feedback
                    toast.success(`Selected: ${val.estimateLevel} - ${val.estimateTargetId}`)
                  } else {
                    // Clear form if invalid selection
                    form.setValue("estimateId", "")
                    form.setValue("allocationRef", "")
                  }
                }}
              />
              {/* Show validation errors for estimate selection */}
              {form.formState.errors.estimateId && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.estimateId.message}
                </p>
              )}
              {form.formState.errors.allocationRef && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.allocationRef.message}
                </p>
              )}
            </div>

            {/* Budget Amount */}
            <FormField
              control={form.control}
              name="allocatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount (KES) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter budget amount"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === "" ? 0 : Number.parseFloat(value) || 0)
                      }}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Read-only allocation details */}
            <div className="grid grid-cols-2 gap-4 text-sm border rounded-lg p-3 bg-muted/50">
              <div>
                <Label className="text-xs">Estimate ID</Label>
                <div className="text-muted-foreground mt-1 font-mono text-xs">
                  {form.watch("estimateId") || "Not selected"}
                </div>
              </div>
              <div>
                <Label className="text-xs">Allocation Level</Label>
                <div className="text-muted-foreground mt-1 capitalize">
                  {form.watch("allocationLevel") || "Not selected"}
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Reference ID</Label>
                <div className="text-muted-foreground mt-1 font-mono text-xs break-all">
                  {form.watch("allocationRef") || "Not selected"}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || projectsLoading || !form.watch("estimateId") || !form.watch("allocationRef")}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                Allocate Budget
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}