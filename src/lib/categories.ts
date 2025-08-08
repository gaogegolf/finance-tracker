export const CATEGORY_MAPPING: Record<string, string> = {
  'Food and Drink': 'Food & Dining',
  'Shops': 'Shopping',
  'Recreation': 'Entertainment',
  'Transportation': 'Transportation',
  'Healthcare': 'Healthcare',
  'Financial': 'Financial',
  'Travel': 'Travel',
  'Deposit': 'Income',
  'Transfer': 'Transfer',
  'Payment': 'Bills & Utilities',
  'Service': 'Services'
}

export function normalizeCategory(plaidCategories: string[]): string {
  if (!plaidCategories || plaidCategories.length === 0) return 'Other'
  
  const primaryCategory = plaidCategories[0]
  return CATEGORY_MAPPING[primaryCategory] || primaryCategory
}

export function detectTransfer(
  transactions: Array<{
    amount: number
    date: Date
    accountId: string
    name: string
  }>,
  currentTransaction: {
    amount: number
    date: Date
    accountId: string
    name: string
  }
): boolean {
  const currentAmount = Math.abs(currentTransaction.amount)
  const currentDate = new Date(currentTransaction.date)
  
  const potentialTransfers = transactions.filter(txn => {
    if (txn.accountId === currentTransaction.accountId) return false
    
    const txnAmount = Math.abs(txn.amount)
    const txnDate = new Date(txn.date)
    const amountDiff = Math.abs(currentAmount - txnAmount) / currentAmount
    const daysDiff = Math.abs(currentDate.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24)
    
    return amountDiff <= 0.03 && daysDiff <= 1
  })
  
  return potentialTransfers.length > 0 || 
         currentTransaction.name.toLowerCase().includes('transfer') ||
         currentTransaction.name.toLowerCase().includes('payment')
}