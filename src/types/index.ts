export interface User {
  id: string
  email: string
  syncFrequency: string
}

export interface Account {
  id: string
  name: string
  mask?: string
  type: string
  subtype?: string
  institutionName?: string
  institutionStatus?: string
  balance: number
  lastUpdated: Date
  isActive?: boolean
}

export interface Transaction {
  id: string
  amount: number
  date: Date
  name: string
  merchantName?: string
  category: string
  isTransfer: boolean
  account: {
    name: string
    type: string
  }
}

export interface ManualAsset {
  id: string
  name: string
  currentValue: number
  createdAt: Date
  updatedAt: Date
}

export interface NetWorthSeries {
  date: string
  assets: number
  liabilities: number
  netWorth: number
  accounts: Record<string, {
    type: string
    balance: number
  }>
}

export interface SpendSummary {
  month: string
  totalIncome: number
  totalSpending: number
  netCashFlow: number
  byCategory: Record<string, number>
  topMerchants: Record<string, number>
}