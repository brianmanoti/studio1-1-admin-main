import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Wrench,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"

interface BudgetItem {
  id: string
  name: string
  total: number
  spent: number
  balance: number
  status: "on-track" | "warning" | "over-budget"
  variance?: number
  lastUpdated?: string
}

interface BudgetViewProps {
  estimate?: {
    estimateId: string
    name: string
    total: number
    spent: number
    balance: number
    variance?: number
    efficiency?: number
  }
  purchaseOrders?: BudgetItem[]
  wages?: BudgetItem[]
  expenses?: BudgetItem[]
  subcontractors?: BudgetItem[]
}

export default function BudgetView({
  estimate = {
    estimateId: "EST-sample123",
    name: "Commercial Building Project",
    total: 2450000,
    spent: 892000,
    balance: 1558000,
    variance: -45000,
    efficiency: 87.2,
  },
  purchaseOrders = [
    {
      id: "PO-001",
      name: "Steel & Concrete Materials",
      total: 450000,
      spent: 320000,
      balance: 130000,
      status: "on-track",
      variance: -15000,
      lastUpdated: "2 hours ago",
    },
    {
      id: "PO-002",
      name: "Heavy Equipment Rental",
      total: 180000,
      spent: 180000,
      balance: 0,
      status: "on-track",
      variance: 0,
      lastUpdated: "1 day ago",
    },
    {
      id: "PO-003",
      name: "Safety Equipment",
      total: 25000,
      spent: 28000,
      balance: -3000,
      status: "over-budget",
      variance: 3000,
      lastUpdated: "3 hours ago",
    },
  ],
  wages = [
    {
      id: "W-001",
      name: "Project Manager",
      total: 85000,
      spent: 32000,
      balance: 53000,
      status: "on-track",
      variance: -2000,
      lastUpdated: "1 hour ago",
    },
    {
      id: "W-002",
      name: "Construction Crew",
      total: 420000,
      spent: 165000,
      balance: 255000,
      status: "on-track",
      variance: -8000,
      lastUpdated: "2 hours ago",
    },
    {
      id: "W-003",
      name: "Site Supervisors",
      total: 120000,
      spent: 48000,
      balance: 72000,
      status: "warning",
      variance: 5000,
      lastUpdated: "4 hours ago",
    },
  ],
  expenses = [
    {
      id: "E-001",
      name: "Permits & Inspections",
      total: 35000,
      spent: 35000,
      balance: 0,
      status: "on-track",
      variance: 0,
      lastUpdated: "1 week ago",
    },
    {
      id: "E-002",
      name: "Insurance & Bonds",
      total: 45000,
      spent: 15000,
      balance: 30000,
      status: "on-track",
      variance: -2000,
      lastUpdated: "3 days ago",
    },
    {
      id: "E-003",
      name: "Utilities & Site Prep",
      total: 28000,
      spent: 32000,
      balance: -4000,
      status: "over-budget",
      variance: 4000,
      lastUpdated: "1 day ago",
    },
  ],
  subcontractors = [
    {
      id: "SC-001",
      name: "Electrical Systems",
      total: 285000,
      spent: 95000,
      balance: 190000,
      status: "on-track",
      variance: -12000,
      lastUpdated: "6 hours ago",
    },
    {
      id: "SC-002",
      name: "HVAC Installation",
      total: 220000,
      spent: 0,
      balance: 220000,
      status: "on-track",
      variance: 0,
      lastUpdated: "Not started",
    },
    {
      id: "SC-003",
      name: "Plumbing & Fire Safety",
      total: 165000,
      spent: 42000,
      balance: 123000,
      status: "warning",
      variance: 8000,
      lastUpdated: "1 day ago",
    },
  ],
}: BudgetViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatVariance = (variance: number) => {
    const isPositive = variance > 0
    return {
      value: formatCurrency(Math.abs(variance)),
      isPositive,
      color: isPositive ? "text-red-400" : "text-green-400",
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">On Track</Badge>
      case "warning":
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Warning</Badge>
      case "over-budget":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Over Budget</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Unknown</Badge>
    }
  }

  const totalBudget = estimate.total
  const totalSpent = estimate.spent
  const spentPercentage = (totalSpent / totalBudget) * 100
  const efficiency = estimate.efficiency || 0

  const FinancialInsights = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Budget Efficiency</p>
              <p className="text-2xl font-bold text-foreground">{efficiency}%</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <div className="mt-2">
            <Progress value={efficiency} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Burn Rate</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSpent / 12)}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
            <BarChart3 className="h-8 w-8 text-chart-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Variance</p>
              <div className="flex items-center gap-1">
                <p className={`text-2xl font-bold ${formatVariance(estimate.variance || 0).color}`}>
                  {formatVariance(estimate.variance || 0).value}
                </p>
                {(estimate.variance || 0) > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-400" />
                )}
              </div>
            </div>
            <TrendingDown className="h-8 w-8 text-green-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-2xl font-bold text-foreground">{spentPercentage.toFixed(1)}%</p>
            </div>
            <PieChart className="h-8 w-8 text-chart-3" />
          </div>
          <div className="mt-2">
            <Progress value={spentPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const BudgetSection = ({
    title,
    items,
    icon: Icon,
    totalBudget,
    totalSpent,
  }: {
    title: string
    items: BudgetItem[]
    icon: any
    totalBudget: number
    totalSpent: number
  }) => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">{title}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-lg font-bold">{formatCurrency(totalBudget)}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const spentPercentage = (item.spent / item.total) * 100
          const variance = formatVariance(item.variance || 0)

          return (
            <div key={item.id} className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{item.name}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                    <p className="text-xs text-muted-foreground">Updated {item.lastUpdated}</p>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Budget</p>
                  <p className="font-semibold text-sm">{formatCurrency(item.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Spent</p>
                  <p className="font-semibold text-sm">{formatCurrency(item.spent)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className={`font-semibold text-sm ${item.balance < 0 ? "text-red-400" : "text-foreground"}`}>
                    {formatCurrency(item.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Variance</p>
                  <div className="flex items-center gap-1">
                    <p className={`font-semibold text-sm ${variance.color}`}>{variance.value}</p>
                    {(item.variance || 0) > 0 ? (
                      <TrendingUp className="h-3 w-3 text-red-400" />
                    ) : (item.variance || 0) < 0 ? (
                      <TrendingDown className="h-3 w-3 text-green-400" />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-mono text-muted-foreground">{spentPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(spentPercentage, 100)} className="h-2" />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                {estimate.name} • {estimate.estimateId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Last 30 days
              </Button>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <FinancialInsights />

        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary" />
              <span>Budget Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-6 bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">Total Budget</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="text-center p-6 bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
                <p className="text-3xl font-bold text-chart-2">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-center p-6 bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">Remaining</p>
                <p className="text-3xl font-bold text-chart-3">{formatCurrency(estimate.balance)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-mono text-muted-foreground">{spentPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={spentPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BudgetSection
            title="Purchase Orders"
            items={purchaseOrders}
            icon={ShoppingCart}
            totalBudget={purchaseOrders.reduce((sum, item) => sum + item.total, 0)}
            totalSpent={purchaseOrders.reduce((sum, item) => sum + item.spent, 0)}
          />
          <BudgetSection
            title="Wages & Labor"
            items={wages}
            icon={Users}
            totalBudget={wages.reduce((sum, item) => sum + item.total, 0)}
            totalSpent={wages.reduce((sum, item) => sum + item.spent, 0)}
          />
          <BudgetSection
            title="Operating Expenses"
            items={expenses}
            icon={DollarSign}
            totalBudget={expenses.reduce((sum, item) => sum + item.total, 0)}
            totalSpent={expenses.reduce((sum, item) => sum + item.spent, 0)}
          />
          <BudgetSection
            title="Subcontractors"
            items={subcontractors}
            icon={Wrench}
            totalBudget={subcontractors.reduce((sum, item) => sum + item.total, 0)}
            totalSpent={subcontractors.reduce((sum, item) => sum + item.spent, 0)}
          />
        </div>
      </div>
    </div>
  )
}
