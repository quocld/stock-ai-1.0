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

  // Calculate price changes
  const firstPrice = stockData[0].close
  const lastPrice = stockData[stockData.length - 1].close
  const priceChange = lastPrice - firstPrice
  const percentChange = (priceChange / firstPrice) * 100
  const isPositive = priceChange >= 0

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
            const value = context.parsed.y
            // Format large numbers with commas and round to 2 decimal places
            const formattedValue = value >= 1000 
              ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : value.toFixed(2)
            return `$${formattedValue}`
          },
          title: (context) => {
            const date = new Date(context[0].label)
            return date.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })
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
          callback: (value) => {
            // Format large numbers with commas and round to 2 decimal places
            const numValue = Number(value)
            return numValue >= 1000 
              ? `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `$${numValue.toFixed(2)}`
          }
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
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4 gap-1 sm:gap-0">
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            {symbol} Stock Price
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              ${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)} ({Math.abs(percentChange).toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
            Last 7 days
          </span>
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
            {new Date(stockData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(stockData[stockData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="h-36 sm:h-40 md:h-48 -mx-2 sm:mx-0">
        <Line data={chartData} options={{
          ...options,
          scales: {
            x: {
              ...(options.scales?.x || {}),
              ticks: {
                ...(options.scales?.x?.ticks || {}),
                maxTicksLimit: window.innerWidth < 640 ? 4 : window.innerWidth < 1024 ? 5 : 7,
                font: {
                  size: window.innerWidth < 640 ? 10 : 11,
                }
              }
            },
            y: {
              ...(options.scales?.y || {}),
              ticks: {
                ...(options.scales?.y?.ticks || {}),
                font: {
                  size: window.innerWidth < 640 ? 10 : 11,
                }
              }
            }
          }
        }} />
      </div>
      <div className="mt-2 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
        <div>
          <div className="font-medium">Open</div>
          <div className="mt-0.5 sm:mt-1">${firstPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="font-medium">Close</div>
          <div className="mt-0.5 sm:mt-1">${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="font-medium">Change</div>
          <div className={`mt-0.5 sm:mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="font-medium">Change %</div>
          <div className={`mt-0.5 sm:mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
} 