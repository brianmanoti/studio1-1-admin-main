"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopSubcontractorsProps {
  subcontractors: Array<{ name: string; rate: number; quantity: number; code?: string }>
}

const formatCurrency = (num: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(num || 0)

export function TopSubcontractors({ subcontractors }: TopSubcontractorsProps) {
  if (!subcontractors?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Subcontractors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No subcontractor data available.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort by total spend (rate * quantity)
  const sortedSubs = [...subcontractors].sort(
    (a, b) => b.rate * b.quantity - a.rate * a.quantity
  )

  const topSubs = sortedSubs.slice(0, 5)
  const maxSpend = Math.max(...topSubs.map((s) => s.rate * s.quantity), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Subcontractors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {topSubs.map((sub, index) => {
            const totalSpend = sub.rate * sub.quantity
            return (
              <div
                key={`${sub.code || sub.name}-${index}`}
                className="space-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Name + Rank + Spend */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                    <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                      {sub.name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(totalSpend)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary/40 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-600 to-green-400 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(totalSpend / maxSpend) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
