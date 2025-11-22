import { useMutation } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'

interface DownloadPOParams {
  id: string
}

export const useDownloadEstimatePDF = () => {
  return useMutation({
    mutationFn: async ({ id }: DownloadPOParams) => {
      const response = await axiosInstance.get(`/api/estimates/project/${id}/estimates-pdf`, {
        responseType: 'blob', // 🧾 Important: keeps PDF binary intact
      })
      return response.data // returns Blob
    },
  })
}
