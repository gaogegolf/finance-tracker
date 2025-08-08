'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CashFlowChartProps {
  data: {
    totalIncome: number
    totalSpending: number
    netCashFlow: number
    month: string
  }
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const chartData = [
    {
      name: 'Income',
      value: data.totalIncome,
      color: '#10b981'
    },
    {
      name: 'Spending',
      value: data.totalSpending,
      color: '#ef4444'
    },
    {
      name: 'Net',
      value: data.netCashFlow,
      color: data.netCashFlow >= 0 ? '#10b981' : '#ef4444'
    }
  ]

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" className="text-sm" />
          <YAxis tickFormatter={formatCurrency} className="text-sm" />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}