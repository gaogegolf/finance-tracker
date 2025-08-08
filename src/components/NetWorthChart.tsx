'use client'

import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'

interface NetWorthChartProps {
  data: Array<{
    date: string
    assets: number
    liabilities: number
    netWorth: number
  }>
}

export default function NetWorthChart({ data }: NetWorthChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d')
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="assets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="liabilities" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="text-sm"
          />
          <YAxis
            tickFormatter={formatCurrency}
            className="text-sm"
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            labelFormatter={formatDate}
          />
          <Area
            type="monotone"
            dataKey="assets"
            stackId="1"
            stroke="#10b981"
            fill="url(#assets)"
            name="Assets"
          />
          <Area
            type="monotone"
            dataKey="liabilities"
            stackId="1"
            stroke="#ef4444"
            fill="url(#liabilities)"
            name="Liabilities"
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            name="Net Worth"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}