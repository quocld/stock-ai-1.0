'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface StockData {
  date: string
  close: number
}

interface StockChartProps {
  symbol: string
}

export function StockChart({ symbol }: StockChartProps) {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Using our API route
        const apiUrl = `/api/stock?symbol=${symbol}`
        console.log('Fetching stock data from:', apiUrl)

        const response = await fetch(apiUrl)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch stock data: ${response.status}`)
        }

        const data = await response.json()
        console.log('API Response:', JSON.stringify(data, null, 2))

        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
          throw new Error('Invalid data format received from API')
        }

        const result = data.chart.result[0]
        const timestamps = result.timestamp
        const quotes = result.indicators.quote[0]

        if (!timestamps || !quotes || !quotes.close) {
          throw new Error('Missing required data in API response')
        }

        // Process the data
        const last7Days = timestamps
          .map((timestamp: number, index: number) => {
            const close = quotes.close[index]
            if (close === null || close === undefined) return null

            return {
              date: new Date(timestamp * 1000).toLocaleDateString(),
              close: close
            }
          })
          .filter((item: StockData | null): item is StockData => 
            item !== null && !isNaN(item.close)
          )
          .slice(-7) // Get last 7 days

        console.log('Processed data:', last7Days)

        if (last7Days.length === 0) {
          throw new Error('No valid data points found')
        }

        setStockData(last7Days)
      } catch (err) {
        console.error('Error fetching stock data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stock data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockData()
  }, [symbol])

  if (isLoading) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading stock data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Chart not available for {symbol}
        </p>
      </div>
    )
  }

  if (stockData.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          No data available for {symbol}
        </p>
      </div>
    )
  }

  const chartData: ChartData<'line'> = {
    labels: stockData.map(d => d.date),
    datasets: [
      {
        label: `${symbol} Stock Price`,
        data: stockData.map(d => d.close),
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            return `$${context.parsed.y.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 5,
          color: 'rgb(156, 163, 175)', // gray-400
          font: {
            size: 11,
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)', // gray-400
          font: {
            size: 11,
          },
          callback: (value) => `$${value}`
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  }

  return (
    <div className="w-full h-48 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {symbol} Stock Price
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last 7 days
        </span>
      </div>
      <div className="h-36">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
} 