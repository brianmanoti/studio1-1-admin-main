"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SpendTrendChartProps {
  data: Array<{ totalAmount: number; month: string }>
}

export function SpendTrendChart({ data }: SpendTrendChartProps) {
  const chartData = data.map((item) => ({
    month: new Date(item.month).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    amount: item.totalAmount,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Spend Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
            <XAxis dataKey="month" stroke="hsl(var(--color-muted-foreground))" style={{ fontSize: "12px" }} />
            <YAxis stroke="hsl(var(--color-muted-foreground))" style={{ fontSize: "12px" }} />
            <Tooltip
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              contentStyle={{
                backgroundColor: "hsl(var(--color-card))",
                border: "1px solid hsl(var(--color-border))",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--color-primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--color-primary))", r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
