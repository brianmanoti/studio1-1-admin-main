import Clients from '@/features/clients'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/Clients/')({
  component: Clients,
})

