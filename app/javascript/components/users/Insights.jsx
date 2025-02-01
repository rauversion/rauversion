import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { get } from '@rails/request.js'
import { Play } from 'lucide-react'
import Chart from 'chart.js/auto'

export default function Insights() {
  const { username } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await get(`/${username}/insights.json`)
        if (response.ok) {
          const jsonData = await response.json
          setData(jsonData)
        }
      } catch (error) {
        console.error('Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [username])

  useEffect(() => {
    // Only initialize chart when both data and canvas element are available
    if (data?.chart_data && chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      // Format dates for display
      const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('default', { month: 'short', day: 'numeric' })
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.chart_data.map(d => formatDate(d.day)),
          datasets: [{
            label: 'Plays',
            data: data.chart_data.map(d => d.count),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
              }
            },
            tooltip: {
              callbacks: {
                title: (context) => {
                  const dataIndex = context[0].dataIndex
                  return new Date(data.chart_data[dataIndex].day).toLocaleDateString('default', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
                precision: 0
              },
              grid: {
                color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              ticks: {
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
              },
              grid: {
                color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      })
    }
  }, [data, chartRef.current]) // Re-run when data or canvas element changes

  if (loading || !data) {
    return (
      <div className="flex-grow bg-default text-default">
        <div className="mx-auto w-3/4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-grow bg-default text-default">
      <div className="mx-auto w-3/4">
        <div className="pt-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Last 30 days
          </h3>
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total de escuchas
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {data.stats.plays}
              </dd>
            </div>

            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Me gusta
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {data.stats.likes}
              </dd>
            </div>

            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Repost
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {data.stats.reposts}
              </dd>
            </div>

            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 truncate">Descargas</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {data.stats.downloads}
              </dd>
            </div>

            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 truncate">Comentarios</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {data.stats.comments}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <div className="shadow-lg rounded-lg overflow-hidden my-4 dark:bg-gray-900">
            <canvas
              ref={chartRef}
              className="p-10"
              style={{ height: '539px', width: '100%' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 shadow-lg rounded-lg col-span-2 md:col-span-1 overflow-hidden dark:bg-gray-900">
            <div className="py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Mejores canciones
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Últimos 12 meses
              </p>
            </div>

            <div className="flow-root mt-6">
              <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                {data.top_tracks.map((track) => (
                  <li key={track.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <img src={track.cover_url.small} alt="" className="h-8 w-8 rounded-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {track.title}
                        </p>
                        <div className="text-sm text-gray-500 space-x-2 flex items-center">
                          <Play className="h-5 w-5" />
                          <span>reproduce {track.count}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 shadow-lg rounded-lg col-span-2 md:col-span-1 overflow-hidden dark:bg-gray-900">
            <div className="py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Top oyentes
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Últimos 12 meses
              </p>
            </div>

            <div className="flow-root mt-6">
              <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                {data.top_listeners.map((listener) => (
                  <li key={listener.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={listener.avatar_url.small}
                          alt={listener.username}
                          className="h-8 w-8 rounded-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {listener.username}
                        </p>
                        <div className="text-sm text-gray-500 space-x-2 flex items-center">
                          <Play className="h-5 w-5" />
                          <span>reproduce {listener.count}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 col-span-2 shadow-lg rounded-lg overflow-hidden dark:bg-gray-900">
            <div className="py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Locaciones recurrentes
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Datos personales y aplicación.
              </p>
            </div>

            <div className="flow-root mt-6">
              <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-800">
                {data.top_countries.map((location, index) => (
                  location.country && (
                    <li key={index} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            className="rounded-sm"
                            src={location.flag_url}
                            alt={location.country}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {location.country}
                          </p>
                          <div className="text-sm text-gray-500 space-x-2 flex items-center">
                            <Play className="h-5 w-5" />
                            <span>reproduce {location.count}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
