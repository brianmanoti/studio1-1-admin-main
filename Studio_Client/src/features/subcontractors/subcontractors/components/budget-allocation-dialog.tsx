// components/budget-allocation-dialog.tsx
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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

// ✅ Validation schema
const allocationSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  estimateId: z.string().min(1, "Estimate is required"),
  allocationLevel: z.enum(["group", "section", "subsection"]),
  allocationRef: z.string().min(1, "Allocation reference is required"),
  allocatedBudget: z.number().min(1, "Budget must be greater than 0"),
})

type AllocationData = z.infer<typeof allocationSchema>

interface BudgetAllocationDialogProps {
  subcontractor: Subcontractor
  open: boolean
  onOpenChange: (open: boolean) => void
}

// API call function
const allocateBudget = async (data: {
  subcontractorId: string
  projectId: string
  estimateId: string
  allocatedBudget: number
  allocationLevel: string
  allocationRef: string
}) => {
  const response = await axiosInstance.post("/api/subcontractors/allocated-budget", data)
  return response.data
}

export function BudgetAllocationDialog({ subcontractor, open, onOpenChange }: BudgetAllocationDialogProps) {
  const queryClient = useQueryClient()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()

  // TanStack Query Mutation for budget allocation
  const allocateBudgetMutation = useMutation({
    mutationFn: allocateBudget,
    onSuccess: (data, variables) => {
      // ✅ CORRECTED: Invalidate the actual query keys used by your hooks
      queryClient.invalidateQueries({ 
        queryKey: ["subcontractors"] // Main list that your table uses
      })
      queryClient.invalidateQueries({ 
        queryKey: ["subcontractors", subcontractor._id] // Individual subcontractor
      })
      
      // Also invalidate project and estimate related queries if they exist
      queryClient.invalidateQueries({ 
        queryKey: ["projects", variables.projectId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ["estimates", variables.estimateId] 
      })

      toast.success(
        `Budget of KES ${variables.allocatedBudget.toLocaleString("en-KE")} allocated successfully to ${subcontractor.companyName}`
      )
      
      form.reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      console.error("Budget allocation error:", error)
      const errorMessage =
        error.response?.data?.message || error.response?.data?.details || error.message || "Failed to allocate budget."
      toast.error(errorMessage)
    },
    // Enhanced optimistic updates for immediate UI feedback
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["subcontractors"] })
      await queryClient.cancelQueries({ queryKey: ["subcontractors", subcontractor._id] })

      // Snapshot previous values
      const previousSubcontractors = queryClient.getQueryData(["subcontractors"])
      const previousSubcontractor = queryClient.getQueryData(["subcontractors", subcontractor._id])

      // Optimistically update the main list
      queryClient.setQueryData(
        ["subcontractors"],
        (old: Subcontractor[] | undefined) => {
          if (!old) return old
          return old.map(sub => 
            sub._id === subcontractor._id 
              ? {
                  ...sub,
                  totalAllocatedBudget: (sub.totalAllocatedBudget || 0) + variables.allocatedBudget,
                  netBalance: (sub.netBalance || 0) + variables.allocatedBudget
                }
              : sub
          )
        }
      )

      // Optimistically update individual subcontractor
      queryClient.setQueryData(
        ["subcontractors", subcontractor._id],
        (old: Subcontractor | undefined) => {
          if (!old) return old
          return {
            ...old,
            totalAllocatedBudget: (old.totalAllocatedBudget || 0) + variables.allocatedBudget,
            netBalance: (old.netBalance || 0) + variables.allocatedBudget,
            projects: [
              ...(old.projects || []),
              {
                projectId: variables.projectId,
                estimateId: variables.estimateId,
                allocationLevel: variables.allocationLevel,
                allocationRef: variables.allocationRef,
                allocatedBudget: variables.allocatedBudget,
                totalWages: 0,
                totalExpenses: 0,
                totalPOS: 0,
                balance: variables.allocatedBudget,
                progress: 0,
                lastUpdated: new Date().toISOString()
              } as any
            ]
          }
        }
      )

      return { previousSubcontractors, previousSubcontractor }
    },
    // Rollback on error
    onSettled: (data, error, variables, context) => {
      if (error) {
        // Rollback main list
        queryClient.setQueryData(["subcontractors"], context?.previousSubcontractors)
        // Rollback individual subcontractor
        queryClient.setQueryData(["subcontractors", subcontractor._id], context?.previousSubcontractor)
      }
      
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] })
      queryClient.invalidateQueries({ queryKey: ["subcontractors", subcontractor._id] })
    },
  })

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

  const projectOptions = projects.map((project) => ({
    value: project._id,
    label: `${project.name} (${project.projectNumber})`,
  }))

  // Reset estimate selection when project changes
  useEffect(() => {
    form.setValue("estimateId", "")
    form.setValue("allocationLevel", "group")
    form.setValue("allocationRef", "")
    form.clearErrors(["estimateId", "allocationRef"])
  }, [form.watch("projectId")])

  const onSubmit = async (data: AllocationData) => {
    // Client-side validation
    if (!data.projectId || !data.estimateId || !data.allocationRef || data.allocatedBudget <= 0) {
      toast.error("Please fill all required fields correctly")
      return
    }

    // Validate subcontractor exists
    if (!subcontractor?._id) {
      toast.error("Subcontractor information is missing")
      return
    }

    allocateBudgetMutation.mutate({
      subcontractorId: subcontractor._id,
      projectId: data.projectId,
      estimateId: data.estimateId,
      allocatedBudget: data.allocatedBudget,
      allocationLevel: data.allocationLevel,
      allocationRef: data.allocationRef,
    })
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to allow animation to complete
      const timer = setTimeout(() => {
        form.reset()
        allocateBudgetMutation.reset()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-[500px] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Allocate Budget
          </DialogTitle>
          <DialogDescription className="text-sm">
            Allocate budget to {subcontractor.companyName} for a specific project and estimate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Project Selection */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Project *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={projectsLoading || allocateBudgetMutation.isPending}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select a project"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {projectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-sm">
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
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Estimate Selector */}
              {form.watch("projectId") && (
                <FormField
                  control={form.control}
                  name="estimateId"
                  render={({ field, formState }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm">Estimate Allocation *</FormLabel>

                      <EstimateSelector
                        projectId={form.watch("projectId")}
                        onChange={(val) => {
                          if (!val.estimateId || !val.estimateTargetId || !val.estimateLevel) {
                            // Reset if invalid
                            if (form.getValues("estimateId") !== "") form.setValue("estimateId", "")
                            if (form.getValues("allocationLevel") !== "group") form.setValue("allocationLevel", "group")
                            if (form.getValues("allocationRef") !== "") form.setValue("allocationRef", "")
                            return
                          }

                          // Only update if values changed
                          if (form.getValues("estimateId") !== val.estimateId) {
                            form.setValue("estimateId", val.estimateId, { shouldValidate: true })
                          }
                          if (form.getValues("allocationLevel") !== val.estimateLevel) {
                            form.setValue("allocationLevel", val.estimateLevel as AllocationData["allocationLevel"], { shouldValidate: true })
                          }
                          if (form.getValues("allocationRef") !== val.estimateTargetId) {
                            form.setValue("allocationRef", val.estimateTargetId, { shouldValidate: true })
                          }
                        }}
                        disabled={allocateBudgetMutation.isPending}
                      />
                      <FormMessage className="text-xs" />
                      {formState.errors.allocationRef && (
                        <p className="text-xs font-medium text-destructive">{formState.errors.allocationRef.message}</p>
                      )}
                    </FormItem>
                  )}
                />
              )}

              {/* Budget Amount */}
              <FormField
                control={form.control}
                name="allocatedBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Budget Amount (KES) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter budget amount"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === "" ? 0 : Number.parseFloat(value) || 0)
                        }}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                        disabled={allocateBudgetMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Read-only allocation details */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm border rounded-lg p-3 bg-muted/50">
                <div>
                  <Label className="text-xs font-medium">Estimate ID</Label>
                  <div className="text-muted-foreground mt-1 font-mono text-xs break-all min-h-[20px]">
                    {form.watch("estimateId") || "Not selected"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium">Allocation Level</Label>
                  <div className="text-muted-foreground mt-1 capitalize text-xs min-h-[20px]">
                    {form.watch("allocationLevel") || "Not selected"}
                  </div>
                </div>
                <div className="xs:col-span-2">
                  <Label className="text-xs font-medium">Reference ID</Label>
                  <div className="text-muted-foreground mt-1 font-mono text-xs break-all min-h-[20px]">
                    {form.watch("allocationRef") || "Not selected"}
                  </div>
                </div>
              </div>

              {/* Mutation status */}
              {allocateBudgetMutation.isError && (
                <div className="p-3 text-sm border border-destructive/50 bg-destructive/10 rounded-lg">
                  <p className="text-destructive font-medium">Allocation failed</p>
                  <p className="text-destructive/80 text-xs mt-1">
                    {allocateBudgetMutation.error?.message || "Please try again"}
                  </p>
                </div>
              )}
            </div>

            {/* Fixed Action Buttons */}
            <div className="flex-shrink-0 border-t p-4 bg-background">
              <div className="flex flex-col xs:flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset()
                    allocateBudgetMutation.reset()
                    onOpenChange(false)
                  }}
                  disabled={allocateBudgetMutation.isPending}
                  className="flex-1 xs:flex-none order-2 xs:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    allocateBudgetMutation.isPending || 
                    projectsLoading || 
                    !form.watch("estimateId") || 
                    !form.watch("allocationRef") ||
                    form.watch("allocatedBudget") <= 0
                  }
                  className="gap-2 flex-1 xs:flex-none order-1 xs:order-2"
                >
                  {allocateBudgetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  {allocateBudgetMutation.isPending ? "Allocating..." : "Allocate Budget"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}