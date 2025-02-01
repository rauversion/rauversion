import { useState, useEffect, useRef, useCallback } from 'react'
import { get } from '@rails/request.js'

export function useInfiniteScroll(fetchUrl, options = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const observer = useRef()

  const lastElementRef = useCallback(node => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  const fetchItems = async (pageNum) => {
    try {
      setLoading(true)
      const url = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}page=${pageNum}`
      const response = await get(url)
      if (response.ok) {
        const data = await response.json
        setItems(prevItems => {
          if (pageNum === 1) return data.collection
          return [...prevItems, ...data.collection]
        })
        setHasMore(data.metadata.next_page !== null)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetList = useCallback(() => {
    setPage(1)
    setItems([])
    setHasMore(true)
  }, [])

  useEffect(() => {
    resetList()
  }, [fetchUrl])

  useEffect(() => {
    fetchItems(page)
  }, [fetchUrl, page])

  return {
    items,
    loading,
    hasMore,
    lastElementRef,
    resetList,
    setItems
  }
}
