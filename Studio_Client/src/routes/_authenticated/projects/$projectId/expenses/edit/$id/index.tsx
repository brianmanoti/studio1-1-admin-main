import ExpenseForm from '@/features/expenses/components/new/expenses-form'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute(
  '/_authenticated/projects/$projectId/expenses/edit/$id/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const [expenseId, setExpenseId] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Safe attempt to read param even if route context not ready
      const params = useParams({ strict: false }) as { id?: string }
      setExpenseId(params?.id ?? null)
    } catch {
      setExpenseId(null)
    }
  }, [])

  return <ExpenseForm expenseId={expenseId} />
}
