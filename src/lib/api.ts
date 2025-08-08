'use client'

class ApiClient {
  private baseURL = '/api'
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  // Auth
  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  // Plaid Link
  async createLinkToken() {
    return this.request('/link/token', { method: 'POST' })
  }

  async exchangePublicToken(publicToken: string) {
    return this.request('/link/exchange', {
      method: 'POST',
      body: JSON.stringify({ public_token: publicToken })
    })
  }

  // Accounts
  async getAccounts() {
    return this.request('/accounts')
  }

  async updateAccount(accountId: string, data: { isActive?: boolean }) {
    return this.request(`/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async getAccountBalances(accountId: string, from?: string, to?: string) {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    
    return this.request(`/accounts/${accountId}?${params.toString()}`)
  }

  // Transactions
  async getTransactions(params: {
    from?: string
    to?: string
    accountId?: string
    category?: string
    search?: string
    limit?: number
    cursor?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString())
    })
    
    return this.request(`/transactions?${searchParams.toString()}`)
  }

  async updateTransaction(transactionId: string, data: { personalCategory?: string, merchantName?: string }) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  // Manual Assets
  async getManualAssets() {
    return this.request('/manual-assets')
  }

  async createManualAsset(name: string, currentValue: number) {
    return this.request('/manual-assets', {
      method: 'POST',
      body: JSON.stringify({ name, currentValue })
    })
  }

  async updateManualAsset(assetId: string, data: { name?: string, currentValue?: number }) {
    return this.request(`/manual-assets/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteManualAsset(assetId: string) {
    return this.request(`/manual-assets/${assetId}`, { method: 'DELETE' })
  }

  // Net Worth
  async getNetWorthSeries(from?: string, to?: string) {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    
    return this.request(`/networth/series?${params.toString()}`)
  }

  // Spending
  async getSpendSummary(month?: string) {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    
    return this.request(`/spend/summary?${params.toString()}`)
  }
}

export const apiClient = new ApiClient()