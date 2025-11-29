import Items from '@/features/items'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/items/')({
  component: Items,
})


