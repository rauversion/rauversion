import { useState, useEffect, useRef, useCallback } from 'react'
import { get } from '@rails/request.js'

export function useInfiniteScroll(fetchUrl, options = {}) {
  const [items, setItems] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const observer = useRef()
  const activeRequestsRef = useRef(0)
  const collectionVersionRef = useRef(0)

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

  const fetchItems = useCallback(async (pageNum = 1, version = collectionVersionRef.current) => {
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
  }, [fetchUrl])

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
    refresh()
  }, [fetchUrl, refresh])

  useEffect(() => {
    if (page === 1) return

    void fetchItems(page, collectionVersionRef.current)
  }, [fetchItems, page])

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
