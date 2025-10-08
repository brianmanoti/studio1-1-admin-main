// lib/hooks/use-import-excel.ts
import { useState } from "react"
import axiosInstance from "../axios"

// --- Interfaces ---
export interface EstimateSubsection {
  id: string
  code: string
  name: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  notes: string[]
}

export interface EstimateSection {
  id: string
  code: string
  name: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  notes: string[]
  subsections: EstimateSubsection[]
}

export interface EstimateGroup {
  id: string
  code: string
  name: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  notes: string[]
  sections: EstimateSection[]
}

// --- Hook ---
export function useImportExcel() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const importExcel = async (formData: FormData): Promise<EstimateGroup[]> => {
    setIsLoading(true)
    setError(null)

    try {
      // ✅ Always include filename for backend parsers (Django/FastAPI/etc.)
      const file = formData.get("file") as File | null
      if (file) {
        formData.delete("file")
        formData.append("file", file, file.name)
      }

      // ✅ Explicitly remove any default headers that might conflict
      const response = await axiosInstance.request<EstimateGroup[]>({
        method: "post",
        url: "/api/upload-estimate",
        data: formData,
        headers: {
          // Let browser define correct multipart boundary
          "Content-Type": undefined,
          Accept: "application/json",
        },
        transformRequest: (data) => data, // prevent JSON encoding
      })

      return response.data
    } catch (err: any) {
      console.error("Upload failed:", err)
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Failed to import Excel file"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return { importExcel, isLoading, error }
}
