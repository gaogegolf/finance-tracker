'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { ManualAsset } from '@/types'

export default function CryptoPage() {
  const [assets, setAssets] = useState<ManualAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', currentValue: 0 })
  const [error, setError] = useState('')
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

  const loadAssets = async () => {
    try {
      const response = await apiClient.getManualAssets()
      setAssets(response.manualAssets)
    } catch (error) {
      console.error('Failed to load assets:', error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        apiClient.clearToken()
        router.push('/auth/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Asset name is required')
      return
    }

    if (formData.currentValue <= 0) {
      setError('Current value must be greater than 0')
      return
    }

    try {
      if (editingAsset) {
        await apiClient.updateManualAsset(editingAsset, formData)
        setEditingAsset(null)
      } else {
        await apiClient.createManualAsset(formData.name, formData.currentValue)
        setShowAddForm(false)
      }
      
      setFormData({ name: '', currentValue: 0 })
      await loadAssets()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save asset')
    }
  }

  const handleEdit = (asset: ManualAsset) => {
    setEditingAsset(asset.id)
    setFormData({ name: asset.name, currentValue: asset.currentValue })
    setError('')
  }

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return
    }

    try {
      await apiClient.deleteManualAsset(assetId)
      await loadAssets()
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  const cancelEdit = () => {
    setEditingAsset(null)
    setShowAddForm(false)
    setFormData({ name: '', currentValue: 0 })
    setError('')
  }

  useEffect(() => {
    loadAssets()
  }, [])

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading crypto assets...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Manual Crypto Assets</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Asset
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
              <p className="text-sm font-medium text-gray-600">Total Crypto Assets Value</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-sm text-gray-600">
                {assets.length} asset{assets.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingAsset) && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bitcoin, Ethereum"
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Value (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.currentValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="input w-full"
                    required
                  />
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={cancelEdit} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assets List */}
        <div className="card">
          {assets.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">₿</div>
              <p className="text-gray-500 text-lg mb-2">No crypto assets yet</p>
              <p className="text-gray-400 mb-4">Add your crypto holdings to track them in your net worth</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Your First Asset
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-medium text-sm">₿</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(asset.currentValue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(asset.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(asset)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
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