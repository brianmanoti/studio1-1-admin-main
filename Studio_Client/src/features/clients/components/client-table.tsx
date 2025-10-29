import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit2, Trash2, Plus } from "lucide-react"
import { ClientModals } from "./client-modals"
import axiosInstance from "@/lib/axios"
import { CreateClientForm } from "./create-client-form"


interface Client {
  _id: string
  clientId: string
  companyName: string
  clientType: string
  primaryContact: string
  email: string
  phone: string
  city: string
  state: string
}

export function ClientsTable() {
  const queryClient = useQueryClient()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [modalType, setModalType] = useState<"view" | "edit" | "delete" | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Fetch clients
  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await axiosInstance.get("/clients")
      return response.data
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setModalType(null)
      setSelectedClient(null)
    },
  })

  const handleView = (client: Client) => {
    setSelectedClient(client)
    setModalType("view")
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setModalType("edit")
  }

  const handleDelete = (client: Client) => {
    setSelectedClient(client)
    setModalType("delete")
  }

  const confirmDelete = () => {
    if (selectedClient) {
      deleteMutation.mutate(selectedClient._id)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading clients...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading clients</div>
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Client
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client ID</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client: Client) => (
              <TableRow key={client._id}>
                <TableCell className="font-medium">{client.clientId}</TableCell>
                <TableCell>{client.companyName}</TableCell>
                <TableCell>{client.primaryContact}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.city}</TableCell>
                <TableCell>{client.clientType}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(client)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(client)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(client)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedClient && (
        <ClientModals
          client={selectedClient}
          modalType={modalType}
          onClose={() => {
            setModalType(null)
            setSelectedClient(null)
          }}
          onConfirmDelete={confirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <CreateClientForm open={showCreateForm} onClose={() => setShowCreateForm(false)} />
    </>
  )
}
