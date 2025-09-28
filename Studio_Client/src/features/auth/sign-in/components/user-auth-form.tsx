"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { useNavigate, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { Loader2, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"
import { cn } from "@/lib/utils"
import axiosInstance from "@/lib/axios"
import { useAuthStore } from "@/stores/auth-store"


// ✅ Zod Schema
const formSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string()
    .min(7, "Password must be at least 7 characters long"),
})

type LoginFormValues = z.infer<typeof formSchema>

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  // ✅ Form setup
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // ✅ Login mutation using TanStack React Query
  const mutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await axiosInstance.post("/api/auth/login", data)
      return response.data
    },
    onSuccess: (data) => {
      //  Update auth store
      auth.setUser(data.user)
      auth.setAccessToken(data.token)

      toast.success(data.message || "Login successful")

    // ✅ wait briefly to allow cookie to persist before redirect
    setTimeout(() => {
      navigate({ to: redirectTo || "/", replace: true })
    }, 150)
    localStorage.setItem('auth_token', data.token)
    
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Login failed ")
    },
  })

  //  Submit handler
  const onSubmit = (values: LoginFormValues) => {
    toast.promise(
      mutation.mutateAsync(values),
      {
        loading: "Signing in...",
        success: "Welcome back!",
        error: "Invalid email or password",
      }
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to="/forgot-password"
                className="text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75"
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button
          type="submit"
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <LogIn className="mr-2" />
          )}
          Sign in
        </Button>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">
              Thank you for using Studio!
            </span>
          </div>
        </div>
      </form>
    </Form>
  )
}
