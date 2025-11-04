import { useMutation } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'

interface DownloadPOParams {
  id: string
}

export const useDownloadWagePDF = () => {
  return useMutation({
    mutationFn: async ({ id }: DownloadPOParams) => {
      const response = await axiosInstance.get(`/api/wages/${id}/pdf`, {
        responseType: 'blob', // 🧾 Important: keeps PDF binary intact
      })
      return response.data // returns Blob
    },
  })
}
