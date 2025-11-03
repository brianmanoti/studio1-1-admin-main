"use client"

import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  Building2,
  FileSpreadsheet,
  ShoppingCart,
  Wallet,
  Users,
  PlusCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react"

interface ModuleInfo {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

const MODULES: ModuleInfo[] = [
  {
    id: "estimate-boq",
    title: "Estimate / BOQ",
    description: "Prepare material take-offs & cost estimates.",
    icon: FileSpreadsheet,
  },
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    description: "Manage vendor orders & procurement tracking.",
    icon: ShoppingCart,
  },
  {
    id: "wages-expenses",
    title: "Wages & Expenses",
    description: "Track daily site costs and labour payments.",
    icon: Wallet,
  },
  {
    id: "payroll",
    title: "Payroll Management",
    description: "Maintain employee records & salary schedules.",
    icon: Users,
  },
]

interface ModuleCardProps {
  module: ModuleInfo
}


const currentYear = new Date().getFullYear()

const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const Icon = module.icon
  return (
    <Card className="opacity-60 cursor-not-allowed border border-blue-100/40 hover:border-blue-200/60 transition-all duration-300 bg-white/40 backdrop-blur-md hover:bg-blue-50/30 shadow-sm hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-blue-700 text-lg">
          <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
          {module.title}
        </CardTitle>
        <CardDescription className="text-slate-600">{module.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-500">Accessible after a project is created.</p>
      </CardContent>
    </Card>
  )
}

const ProjectsEmpty: React.FC = () => {
  const navigate = useNavigate()

  const handleCreateProject = React.useCallback(() => {
    navigate({ to: "/projects/new" })
  }, [navigate])

  return (
    <>
      <Header>
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 bg-clip-text text-transparent">
              Studio 1-1 Construction Ltd
            </h1>
            <p className="text-sm text-slate-600 mt-1">Mombasa • Official Construction & Project Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100/30 px-6 py-16">
        {/* Empty State */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-2xl">
          <div className="h-24 w-24 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/60 shadow-lg">
            <Building2 className="h-12 w-12 text-blue-600" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Welcome to Your Construction Dashboard</h2>
            <p className="text-base text-slate-600 max-w-xl leading-relaxed">
              This platform enables Studio 1-1 Construction Ltd (Mombasa) to manage all ongoing and upcoming projects —
              including BOQ estimations, purchase orders, site expenses, and payroll management — in one place.
            </p>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg px-8 font-semibold"
            onClick={handleCreateProject}
            aria-label="Create a new project"
          >
            <PlusCircle className="h-5 w-5 mr-2" aria-hidden="true" />
            Create New Project
            <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {MODULES.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </Main>

      <footer className="w-full text-center py-6 border-t border-blue-100/50 text-xs text-slate-600 bg-gradient-to-r from-slate-50 to-blue-50/50 shadow-sm">
        <p className="font-medium">© { currentYear } Studio 1-1 Construction Ltd · Mombasa, Kenya · All Rights Reserved</p>
        <p className="mt-2 opacity-75">
          Developed for official use by Studio 1-1 Construction Project Management System v1.0
        </p>
      </footer>
    </>
  )
}

export default ProjectsEmpty
