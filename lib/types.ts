export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
export type TransactionType = 'INCOME' | 'EXPENSE'

export interface Household {
  id: string
  name: string
  block: string
  number: string
  phone: string | null
  isActive: boolean
  _count?: { payments: number }
}

export interface Payment {
  id: string
  householdId: string
  month: number
  year: number
  amount: number
  proofImage: string | null
  status: PaymentStatus
  notes: string | null
  paidAt: string
  verifiedAt: string | null
  verifiedBy: string | null
  createdAt: string
  household: Pick<Household, 'name' | 'block' | 'number' | 'phone'>
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  category: string | null
  date: string
  createdBy: string
  createdAt: string
}

export interface Setting {
  neighborhood_name?: string
  ipl_amount?: string
  payment_due_day?: string
  treasurer_name?: string
  treasurer_phone?: string
  bank_name?: string
  bank_account?: string
  bank_account_name?: string
  [key: string]: string | undefined
}

export interface DashboardSummary {
  totalKas: number
  totalIPLVerified: number
  totalIncome: number
  totalExpense: number
  currentMonth: number
  currentYear: number
  currentMonthTotal: number
  currentMonthPaidCount: number
  activeHouseholds: number
  unpaidCount: number
}

export interface DashboardData {
  summary: DashboardSummary
  currentMonthPayments: Array<{
    id: string
    householdName: string
    block: string
    number: string
    amount: number
    status: PaymentStatus
    paidAt: string
  }>
  unpaidHouseholds: Pick<Household, 'id' | 'name' | 'block' | 'number'>[]
  recentTransactions: Transaction[]
  settings: Setting
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface TransactionSummary {
  incomeTotal: number
  expenseTotal: number
  net: number
}

export interface AdminUser {
  id: string
  username: string
  name: string
  role: string
}
