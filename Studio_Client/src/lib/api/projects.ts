import axiosInstance from "../axios"

export const getProjects = async () => {
  const res = await axiosInstance.get("/api/projects")
  return res.data
}

//  get single project
export const getProjectById = async (id: string) => {
  const res = await axiosInstance.get(`/api/projects/${id}`)
  return res.data
}

//  Create project
export const createProject = async (data: any) => {
  const res = await axiosInstance.post("/api/projects", data)
  return res.data
}

//  Update project
export const updateProject = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/api/projects/${id}`, data)
  return res.data
}

//  Delete project
export const deleteProject = async (id: string) => {
  const res = await axiosInstance.delete(`/api/projects/${id}`)
  return res.data
}