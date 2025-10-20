"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface SpendTrendChartProps {
  data: Array<{ totalAmount: number; month: string }>
}

const formatCurrency = (num: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(num || 0)

export function SpendTrendChart({ data }: SpendTrendChartProps) {
  const chartData = data.map((item) => ({
    month:
      new Date(item.month).toLocaleDateString("en-KE", {
        month: "short",
        year: "2-digit",
      }) || item.month,
    amount: Number(item.totalAmount) || 0,
  }))

  // ✅ Handle empty state gracefully
  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Monthly Spend Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-24 h-2 rounded-full bg-secondary/50 animate-pulse mb-3" />
            <p className="text-sm">No spending data available yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Monthly Spend Trend
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
          >
            {/* ✅ Background Grid */}
            <CartesianGrid strokeDasharray="4 3" stroke="hsl(var(--border))" />

            {/* ✅ Axes */}
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(val) => `K${Math.round(val / 1000)}k`}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            {/* ✅ Gradient Fill */}
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="90%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="amount"
              stroke="none"
              fill="url(#colorSpend)"
            />

            {/* ✅ Custom Tooltip */}
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `📅 ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "10px 14px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              }}
              labelStyle={{
                color: "hsl(var(--muted-foreground))",
                fontWeight: 500,
                fontSize: "13px",
              }}
              itemStyle={{
                color: "hsl(var(--primary))",
                fontWeight: 600,
              }}
            />

            {/* ✅ Spend Line */}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "hsl(var(--primary))",
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
                fill: "hsl(var(--background))",
              }}
            />

            {/* ✅ Optional Legend */}
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={() => "Total Spend (KES)"}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
