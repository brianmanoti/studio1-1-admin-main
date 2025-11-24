import axiosInstance from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'

export function useProjects() {
  return useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/projects')
      return response.data
    },
  })
}