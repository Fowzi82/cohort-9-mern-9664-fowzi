import { useCallback, useEffect, useMemo, useRef } from 'react'

export function useDebouncedCallback(callback, delay) {
  const callbackRef = useRef(callback)
  const timerRef = useRef(null)
  const argsRef = useRef([])

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const flush = useCallback(() => {
    if (!timerRef.current) return
    cancel()
    callbackRef.current(...argsRef.current)
  }, [cancel])

  const debounced = useCallback((...args) => {
    argsRef.current = args
    cancel()
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      callbackRef.current(...argsRef.current)
    }, delay)
  }, [cancel, delay])

  useEffect(() => () => flush(), [flush])

  return useMemo(() => ({ debounced, flush, cancel }), [cancel, debounced, flush])
}
