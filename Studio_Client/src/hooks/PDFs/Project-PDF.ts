import { useMutation } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'

interface DownloadProject {
  id: string
}

export const useDownloadProjectPDF = () => {
  return useMutation({
    mutationFn: async ({ id }: DownloadProject) => {
      const response = await axiosInstance.get(`/api/reports/pdf/project/${id}`, {
        responseType: 'blob', // 🧾 Important: keeps PDF binary intact
      })
      return response.data // returns Blob
    },
  })
}
