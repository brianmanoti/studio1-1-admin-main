import { createFileRoute } from '@tanstack/react-router'
import VerifyEmail from '@/features/auth/sign-up/components/verify'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: VerifyEmail,
})
