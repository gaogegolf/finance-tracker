'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import NetWorthChart from '@/components/NetWorthChart'
import CashFlowChart from '@/components/CashFlowChart'
import CategoryChart from '@/components/CategoryChart'
import { NetWorthSeries, SpendSummary } from '@/types'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [netWorthData, setNetWorthData] = useState<{
    series: NetWorthSeries[]
    currentNetWorth: number
    netWorthChange: number
    totalAssets: number
    totalLiabilities: number
  } | null>(null)
  const [spendData, setSpendData] = useState<SpendSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const router = useRouter()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleLogout = () => {
    apiClient.clearToken()
    router.push('/auth/login')
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    router.push(`/transactions?category=${encodeURIComponent(category)}`)
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [netWorthResponse, spendResponse] = await Promise.all([
          apiClient.getNetWorthSeries(),
          apiClient.getSpendSummary()
        ])
        
        setNetWorthData(netWorthResponse)
        setSpendData(spendResponse)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          apiClient.clearToken()
          router.push('/auth/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finance Tracker</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/accounts"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Accounts
              </Link>
              <Link
                href="/transactions"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Transactions
              </Link>
              <Link
                href="/crypto"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Crypto Assets
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Net Worth Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Worth</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(netWorthData?.currentNetWorth || 0)}
                </p>
                <p className={`text-sm ${
                  (netWorthData?.netWorthChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(netWorthData?.netWorthChange || 0) >= 0 ? '+' : ''}
                  {formatCurrency(netWorthData?.netWorthChange || 0)} vs last month
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(netWorthData?.totalAssets || 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(netWorthData?.totalLiabilities || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Net Worth Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Net Worth Over Time</h3>
            </div>
            {netWorthData?.series && netWorthData.series.length > 0 ? (
              <NetWorthChart data={netWorthData.series} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Cash Flow Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly Cash Flow - {spendData ? format(new Date(spendData.month + '-01'), 'MMMM yyyy') : ''}
              </h3>
            </div>
            {spendData ? (
              <CashFlowChart data={spendData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Spending Category Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
            <p className="text-sm text-gray-600">Click on a category to view transactions</p>
          </div>
          {spendData && Object.keys(spendData.byCategory).length > 0 ? (
            <CategoryChart 
              data={spendData.byCategory} 
              onCategoryClick={handleCategoryClick}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No spending data available
            </div>
          )}
        </div>
      </main>
    </div>
  )
}