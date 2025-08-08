'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { Account } from '@/types'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPlaidLink, setShowPlaidLink] = useState(false)
  const [linkToken, setLinkToken] = useState('')
  const router = useRouter()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  const loadAccounts = async () => {
    try {
      const response = await apiClient.getAccounts()
      setAccounts(response.accounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        apiClient.clearToken()
        router.push('/auth/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAccount = async (accountId: string, isActive: boolean) => {
    try {
      await apiClient.updateAccount(accountId, { isActive: !isActive })
      await loadAccounts()
    } catch (error) {
      console.error('Failed to update account:', error)
    }
  }

  const initiatePlaidLink = async () => {
    try {
      const response = await apiClient.createLinkToken()
      setLinkToken(response.link_token)
      setShowPlaidLink(true)
    } catch (error) {
      console.error('Failed to create link token:', error)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const connectedAccounts = accounts.filter(acc => acc.type !== 'manual')
  const manualAssets = accounts.filter(acc => acc.type === 'manual')
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading accounts...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Accounts</h1>
            </div>
            <button
              onClick={initiatePlaidLink}
              className="btn-primary"
            >
              Connect Bank Account
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Account Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-sm text-gray-600">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Connected Bank Accounts</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {connectedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {account.name}
                          </div>
                          {account.mask && (
                            <div className="text-sm text-gray-500">
                              •••• {account.mask}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.institutionName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="capitalize">
                          {account.subtype || account.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-medium ${
                          account.type === 'credit' 
                            ? account.balance > 0 ? 'text-red-600' : 'text-green-600'
                            : account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(account.lastUpdated)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {account.institutionStatus === 'error' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Error
                            </span>
                          )}
                          {account.institutionStatus === 'relink_required' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Relink Required
                            </span>
                          )}
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={account.isActive !== false}
                              onChange={() => handleToggleAccount(account.id, account.isActive !== false)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Active</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manual Assets */}
        {manualAssets.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manual Assets</h3>
              <Link href="/crypto" className="text-blue-600 hover:text-blue-800 text-sm">
                Manage →
              </Link>
            </div>
            
            <div className="space-y-3">
              {manualAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-medium text-sm">₿</span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      <div className="text-sm text-gray-500">Crypto Asset</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(asset.balance)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Updated {formatDate(asset.lastUpdated)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {accounts.length === 0 && (
          <div className="card">
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🏦</div>
              <p className="text-gray-500 text-lg mb-2">No accounts connected</p>
              <p className="text-gray-400 mb-4">Connect your bank accounts to start tracking your finances</p>
              <button
                onClick={initiatePlaidLink}
                className="btn-primary"
              >
                Connect Your First Account
              </button>
            </div>
          </div>
        )}

        {/* Plaid Link Integration Note */}
        {showPlaidLink && (
          <div className="card mt-6">
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                To complete the bank account connection, you would integrate with Plaid Link here.
              </p>
              <p className="text-sm text-gray-500">
                Link Token: {linkToken ? linkToken.substring(0, 20) + '...' : 'Generated'}
              </p>
              <button
                onClick={() => setShowPlaidLink(false)}
                className="btn-secondary mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}