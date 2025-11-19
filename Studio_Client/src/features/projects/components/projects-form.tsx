// components/ProjectForm.tsx
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"
import { useNavigate } from "@tanstack/react-router"
import { useClients } from "@/lib/hooks/useClients"
import { ArrowLeft } from "lucide-react"

const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  client: z.string().min(1, "Client is required"),
  location: z.string().min(3, "Location is required"),
  type: z.string().min(3, "Project type is required"),
  startDate: z.string().nonempty("Start date is required"),
  status: z.enum(["Pending", "In Progress", "Completed", "On Hold", "Cancelled", "draft"]).optional(),
  endDate: z.string().nonempty("End date is required"),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: any
  onSuccess?: () => void
  onClientSelected?: (id: string) => void
  redirectOnSuccess?: boolean
  onSubmit?: (data: ProjectFormValues) => void
  isLoading?: boolean
  isEdit?: boolean
}

export default function ProjectForm({
  project,
  onSuccess,
  onClientSelected,
  redirectOnSuccess,
  onSubmit,
  isLoading = false,
  isEdit = false,
}: ProjectFormProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: clientsResponse, isLoading: isLoadingClients } = useClients()
  const clients = clientsResponse?.data ?? []

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
      client: project?.client?._id || project?.client || "",
      location: project?.location || "",
      type: project?.type || "",
      startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
      endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      status: project?.status || "draft",
    },
  })

  // Update form when project data changes
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name || "",
        client: project.client?._id || project.client || "",
        location: project.location || "",
        type: project.type || "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
        status: project.status || "draft",
      })
    }
  }, [project, form])

  const createProject = useMutation({
    mutationFn: (data: ProjectFormValues) => axiosInstance.post("/api/projects", data),
    onSuccess: () => {
      toast.success("✅ Project created successfully!")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      form.reset()
      onSuccess?.()
      if (redirectOnSuccess) navigate({ to: "/" })
    },
    onError: (error: any) => {
      toast.error(error?.message || "❌ Error creating project")
    },
  })

  const handleSubmit = (data: ProjectFormValues) => {
    if (isEdit && onSubmit) {
      onSubmit(data)
    } else {
      createProject.mutate(data)
    }
  }

  return (
    <div className={`${!isEdit ? 'min-h-screen bg-gray-50 flex items-center justify-center p-6' : ''}`}>
      <div className={`${!isEdit ? 'w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 relative' : 'w-full'}`}>
        {/* ✅ Back Button */}
        {!isEdit && (
          <Button
            variant="ghost"
            className="absolute top-4 left-4 text-gray-600 hover:text-blue-700 flex items-center gap-2"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back()
              } else {
                navigate({ to: "/" })
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        )}

        <h1 className={`font-bold text-blue-700 mb-8 ${isEdit ? 'text-2xl' : 'text-3xl text-center'}`}>
          {isEdit ? 'Edit Project' : 'Create New Project'}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {field.value
                          ? clients.find((c: any) => c._id === field.value)?.companyName
                          : "Select client"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingClients ? "Loading..." : "No clients found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {clients.map((c: any) => (
                              <CommandItem
                                key={c._id}
                                onSelect={() => {
                                  form.setValue("client", c._id)
                                  onClientSelected?.(c._id)
                                  setOpen(false)
                                }}
                                className="flex flex-col items-start py-2"
                              >
                                <span className="font-medium text-blue-700">
                                  {c.companyName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {c.primaryContact} · {c.email}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Project location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Renovation">Renovation</SelectItem>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg"
              disabled={isLoading || createProject.isPending}
            >
              {isLoading ? "Updating..." : createProject.isPending ? "Creating..." : isEdit ? "Update Project" : "Create Project"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}