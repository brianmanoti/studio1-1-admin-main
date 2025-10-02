import { ConfigDrawer } from "@/components/config-drawer"
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { ExpensesTable } from "@/features/expenses/components/expenses-table"


const SubExpenses = () => {
  return (
    <>
          <Header fixed>
            <Search />
            <div className='ms-auto flex items-center space-x-4'>
              <ThemeSwitch />
              <ConfigDrawer />
              <ProfileDropdown />
            </div>
          </Header>
          <Main>
            <ExpensesTable />
          </Main>
          
    </>
  )
}

export default SubExpenses