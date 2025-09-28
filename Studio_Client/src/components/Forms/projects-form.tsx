
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import { toast } from "react-toastify"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"
import { useNavigate } from "react-router-dom"
import { useClients } from "@/lib/hooks/useClients"

// ✅ Schema
const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  client: z.string().min(1, "Client is required"),
  location: z.string().min(3, "Location is required"),
  type: z.string().min(3, "Project type is required"),
  startDate: z.string().nonempty("Start date is required"),
  endDate: z.string().nonempty("End date is required"),
  status: z
    .enum(["Pending", "In Progress", "Completed", "On Hold", "Cancelled", "draft"])
    .optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  onSuccess?: () => void
  onClientSelected?: (id: string) => void
  redirectOnSuccess?: boolean
}

export default function ProjectForm({
  onSuccess,
  onClientSelected,
  redirectOnSuccess,
}: ProjectFormProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ✅ Clients hook now gives { status, data }
  const { data: clientsResponse, isLoading } = useClients()
  const clients = clientsResponse?.data ?? [] // safe fallback

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      client: "",
      location: "",
      type: "",
      startDate: "",
      endDate: "",
      status: "draft",
    },
  })

  // ✅ Create Project mutation
  const createProject = useMutation({
    mutationFn: (data: ProjectFormValues) => axiosInstance.post("/api/projects", data),
    onSuccess: () => {
      toast.success("✅ Project created successfully!")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      form.reset()
      if (onSuccess) onSuccess()
      if (redirectOnSuccess) navigate("/projects")
    },
    onError: (error: any) => {
      toast.error(error?.message || "❌ Error creating project")
    },
  })

  const onSubmit = (data: ProjectFormValues) => {
    createProject.mutate(data)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Create New Project</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Client with search */}
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
                        {isLoading ? "Loading..." : "No clients found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {clients.map((c: any) => (
                          <CommandItem
                            key={c._id}
                            onSelect={() => {
                              form.setValue("client", c._id)
                              if (onClientSelected) onClientSelected(c._id)
                              setOpen(false)
                            }}
                            className="flex flex-col items-start py-2"
                          >
                            <span className="font-medium text-blue-700">{c.companyName}</span>
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


          {/* Location & Value */}
          <div className="grid grid-cols-2 gap-4">
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
                  <FormControl>
                    <Input placeholder="New home, renovation e.tc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Input placeholder="Pending / In Progress / Completed..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={createProject.isPending}
          >
            {createProject.isPending ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </Form>
    </div>
  )
}