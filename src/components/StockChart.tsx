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
      <div className="w-full h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 p-4 text-center">
        <p>Error loading stock data: {error}</p>
      </div>
    )
  }

  if (stockData.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400 p-4 text-center">
        <p>No data available for {symbol}</p>
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
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  return (
    <div className="w-full h-48 bg-white dark:bg-gray-800 rounded-lg p-4">
      <Line data={chartData} options={options} />
    </div>
  )
} 