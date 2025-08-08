'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CategoryChartProps {
  data: Record<string, number>
  onCategoryClick?: (category: string) => void
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

export default function CategoryChart({ data, onCategoryClick }: CategoryChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const chartData = Object.entries(data).map(([category, amount], index) => ({
    name: category,
    value: amount,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(entry) => onCategoryClick?.(entry.name)}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value: string, entry: any) => `${value}: ${formatCurrency(entry.payload.value)}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}