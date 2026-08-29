import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'

describe('useDebouncedCallback', () => {
  it('debounces calls and flushes the latest one', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 2000))

    act(() => {
      result.current.debounced('first')
      result.current.debounced('second')
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(callback).toHaveBeenCalledWith('second')

    vi.useRealTimers()
  })

  it('flushes a pending call immediately', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 2000))

    act(() => {
      result.current.debounced('now')
      result.current.flush()
    })

    expect(callback).toHaveBeenCalledWith('now')
    vi.useRealTimers()
  })
})
