import axiosInstance from "@/lib/axios"

// ✅ Fetch variations by project
export async function fetchVariations(projectId: string) {
  const { data } = await axiosInstance.get(`/api/variations/project/${projectId}`)
  return data
}

// ✅ Approve, Reject, Delete
export async function approveVariation(id: string) {
  return axiosInstance.put(`/api/variations/${id}/approve`)
}
export async function rejectVariation(id: string) {
  return axiosInstance.put(`/api/variations/${id}/reject`)
}
export async function deleteVariation(id: string) {
  return axiosInstance.delete(`/api/variations/${id}`)
}
