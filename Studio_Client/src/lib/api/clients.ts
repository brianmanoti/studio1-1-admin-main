import axiosInstance from "../axios"

export const getClients = async () => {
  const res = await axiosInstance.get("/api/clients")
  return res.data
}

//  get single project
export const getClientById = async (id: string) => {
  const res = await axiosInstance.get(`/api/clients/${id}`)
  return res.data
}

//  Create Client
export const createClient = async (data: any) => {
  const res = await axiosInstance.post("/api/clients", data)
  return res.data
}

//  Update Client
export const updateClient = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/api/clients/${id}`, data)
  return res.data
}

//  Delete Client
export const deleteClient = async (id: string) => {
  const res = await axiosInstance.delete(`/api/clients/${id}`)
  return res.data
}