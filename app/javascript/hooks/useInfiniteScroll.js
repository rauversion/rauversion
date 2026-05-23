import { useState, useEffect, useRef, useCallback } from 'react'
import { get } from '@rails/request.js'

export function useInfiniteScroll(fetchUrl, options = {}) {
  const { enabled = true } = options
  const [items, setItems] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const observer = useRef()
  const activeRequestsRef = useRef(0)
  const collectionVersionRef = useRef(0)

  const lastElementRef = useCallback(node => {
    if (!enabled) return
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [enabled, loading, hasMore])

  const fetchItems = useCallback(async (pageNum = 1, version = collectionVersionRef.current) => {
    if (!enabled) return

    activeRequestsRef.current += 1

    try {
      setLoading(true)
      const url = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}page=${pageNum}`
      const response = await get(url)

      if (response.ok) {
        const responseData = await response.json

        if (version !== collectionVersionRef.current) return

        setData(responseData)
        setItems(prevItems => {
          if (pageNum === 1) return responseData.collection
          return [...prevItems, ...responseData.collection]
        })
        setHasMore(responseData.metadata.next_page !== null)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1)

      if (activeRequestsRef.current === 0) {
        setLoading(false)
      }
    }
  }, [enabled, fetchUrl])

  const resetList = useCallback(() => {
    setPage(1)
    setItems([])
    setData(null)
    setHasMore(true)
  }, [])

  const refresh = useCallback(() => {
    collectionVersionRef.current += 1
    resetList()
    void fetchItems(1, collectionVersionRef.current)
  }, [fetchItems, resetList])

  useEffect(() => {
    if (!enabled) {
      collectionVersionRef.current += 1
      if (observer.current) observer.current.disconnect()
      setItems([])
      setData(null)
      setHasMore(false)
      setLoading(false)
      return
    }

    refresh()
  }, [enabled, fetchUrl, refresh])

  useEffect(() => {
    if (!enabled) return
    if (page === 1) return

    void fetchItems(page, collectionVersionRef.current)
  }, [enabled, fetchItems, page])

  return {
    items,
    loading,
    hasMore,
    lastElementRef,
    resetList,
    refresh,
    setItems,
    fetchItems,
    data,
    page
  }
}
