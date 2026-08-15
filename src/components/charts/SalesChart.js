import React, { useMemo } from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { CircularProgress } from '@mui/material'
import { roundCurrency } from '@/utils/currencyFormat'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

const SalesChart = ({ dataset, isLoading, hasData }) => {
  const totalAmount = useMemo(() => {
    return roundCurrency(
      (dataset?.amounts || []).reduce((sum, amount) => sum + amount, 0),
    )
  }, [dataset])

  const pieData = useMemo(() => {
    const labels = dataset?.labels || []
    const amounts = dataset?.amounts || []
    const colors = dataset?.colors || []

    return {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    }
  }, [dataset])

  const chartOptions = useMemo(
    () =>
      createPieOptions({
        totalAmount,
      }),
    [totalAmount],
  )

  const legendItems = useMemo(() => {
    if (!pieData.labels?.length) return []
    const labels = pieData.labels
    const amounts = pieData.datasets?.[0]?.data || []
    const colors = pieData.datasets?.[0]?.backgroundColor || []

    return labels
      .map((label, index) => {
        const amount = roundCurrency(amounts[index])
        return {
          label,
          amount,
          color: colors[index],
          percentage: computePercentage(amount, totalAmount),
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [pieData, totalAmount])

  const legendColumns = useMemo(() => {
    if (!legendItems.length) return []
    const columnCount = 3
    const itemsPerColumn = Math.ceil(legendItems.length / columnCount)

    return Array.from({ length: columnCount }, (_, index) =>
      legendItems.slice(index * itemsPerColumn, (index + 1) * itemsPerColumn),
    ).filter((column) => column.length > 0)
  }, [legendItems])

  return (
    <div className="flex flex-col justify-center items-center gap-4 h-full w-full">
      <div className="relative bg-white rounded-lg shadow-sm p-4 w-full h-[360px] transition-opacity duration-300">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
            <CircularProgress size={28} thickness={5} />
          </div>
        )}
        {hasData ? (
          <Pie data={pieData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected filters
          </div>
        )}
      </div>
      <hr className="w-full border-t border-gray-200" />
      {legendColumns.length > 0 && (
        <div className="w-full mt-2 flex justify-center">
          <div className="chart-legend">
            {legendColumns.map((column, columnIndex) => (
              <div
                key={`legend-column-${columnIndex}`}
                className="chart-legend__column"
              >
                {column.map((item) => (
                  <div key={item.label} className="chart-legend__item">
                    <span
                      className="chart-legend__indicator"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="chart-legend__content">
                      <span className="chart-legend__label">{item.label}</span>
                      <span className="chart-legend__value">
                        ₹
                        {item.amount.toLocaleString('en-IN', {
                          maximumFractionDigits: 0,
                        })}{' '}
                        ({item.percentage})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const createPieOptions = ({ totalAmount }) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 500,
    easing: 'easeInOutQuad',
  },
  animations: {
    numbers: {
      type: 'number',
      easing: 'easeOutQuad',
      duration: 500,
    },
    animateRotate: {
      duration: 500,
    },
    animateScale: {
      duration: 500,
    },
  },
  plugins: {
    title: {
      display: false,
      font: {
        size: 16,
        weight: 'bold',
      },
    },
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const amount = roundCurrency(context.raw)
          return `₹${amount.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })} (${computePercentage(amount, totalAmount)})`
        },
      },
    },
  },
})

const computePercentage = (value, total) => {
  if (!total) return '0%'
  return `${((Number(value || 0) / total) * 100).toFixed(1)}%`
}

export default SalesChart
