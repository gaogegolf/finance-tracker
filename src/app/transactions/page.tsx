'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { Transaction, Account } from '@/types'
import { format } from 'date-fns'

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ category: string, merchant: string }>({ category: '', merchant: '' })
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    accountId: '',
    category: '',
    from: '',
    to: ''
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy')
  }

  const loadTransactions = async () => {
    try {
      const params: any = { limit: 100 }
      
      if (filters.search) params.search = filters.search
      if (filters.accountId) params.accountId = filters.accountId
      if (filters.category) params.category = filters.category
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to

      const response = await apiClient.getTransactions(params)
      setTransactions(response.transactions)
    } catch (error) {
      console.error('Failed to load transactions:', error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        apiClient.clearToken()
        router.push('/auth/login')
      }
    }
  }

  const loadAccounts = async () => {
    try {
      const response = await apiClient.getAccounts()
      setAccounts(response.accounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }

  const handleEditTransaction = async (transactionId: string) => {
    try {
      await apiClient.updateTransaction(transactionId, {
        personalCategory: editValues.category || undefined,
        merchantName: editValues.merchant || undefined
      })
      
      setEditingTransaction(null)
      setEditValues({ category: '', merchant: '' })
      await loadTransactions()
    } catch (error) {
      console.error('Failed to update transaction:', error)
    }
  }

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction.id)
    setEditValues({
      category: transaction.category,
      merchant: transaction.merchantName || transaction.name
    })
  }

  const cancelEdit = () => {
    setEditingTransaction(null)
    setEditValues({ category: '', merchant: '' })
  }

  useEffect(() => {
    // Get category filter from URL params
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl) {
      setFilters(prev => ({ ...prev, category: categoryFromUrl }))
    }
  }, [searchParams])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([loadTransactions(), loadAccounts()])
      setIsLoading(false)
    }

    loadData()
  }, [filters])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
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
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Transactions</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search transactions..."
                className="input w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                className="input w-full"
              >
                <option value="">All accounts</option>
                {accounts.filter(acc => acc.type !== 'manual').map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} {account.mask && `(${account.mask})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Filter by category..."
                className="input w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                className="input w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                className="input w-full"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ search: '', accountId: '', category: '', from: '', to: '' })}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {editingTransaction === transaction.id ? (
                          <input
                            type="text"
                            value={editValues.merchant}
                            onChange={(e) => setEditValues(prev => ({ ...prev, merchant: e.target.value }))}
                            className="input w-full"
                          />
                        ) : (
                          <div>
                            <div className="font-medium">
                              {transaction.merchantName || transaction.name}
                            </div>
                            {transaction.isTransfer && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Transfer
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingTransaction === transaction.id ? (
                          <input
                            type="text"
                            value={editValues.category}
                            onChange={(e) => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                            className="input w-full"
                          />
                        ) : (
                          transaction.category
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.account.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-medium ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingTransaction === transaction.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditTransaction(transaction.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(transaction)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  )
}