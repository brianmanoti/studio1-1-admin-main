import { useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import axiosInstance from "@/lib/axios"
import { toast } from "sonner"

export default function VerifyEmail() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get("token")
  const email = params.get("email")

  const verifyMutation = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      const { data } = await axiosInstance.post("/api/auth/verify-email", {
        email,
        token,
      })
      return data
    },
    onSuccess: () => {
      toast.success("Email verified successfully!")
      setTimeout(() => {
        window.location.href = "/sign-in"
      }, 1500)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Verification failed!")
    },
  })

  useEffect(() => {
    if (email && token) {
      verifyMutation.mutate({ email, token })
    }
  }, [email, token])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center border border-gray-200">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">
          Email Verification
        </h1>

        {verifyMutation.isPending && (
          <div className="flex flex-col items-center space-y-3 animate-pulse">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-gray-600">Verifying your email, please wait...</p>
          </div>
        )}

        {verifyMutation.isSuccess && (
          <div className="flex flex-col items-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-green-600 font-semibold">
              ✅ Email verified successfully! Redirecting to login...
            </p>
          </div>
        )}

        {verifyMutation.isError && (
          <div className="flex flex-col items-center space-y-3">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-red-600 font-semibold">
              ❌ Verification failed. The link may be expired or invalid.
            </p>
          </div>
        )}

        {!verifyMutation.isPending &&
          !verifyMutation.isSuccess &&
          !verifyMutation.isError && (
            <p className="text-gray-500">
              Click the verification link in your email to continue.
            </p>
          )}
      </div>
    </div>
  )
}
