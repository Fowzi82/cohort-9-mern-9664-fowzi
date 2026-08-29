import { describe, expect, it } from 'vitest'
import { calculateReadingTime } from '../lib/readingTime'

describe('calculateReadingTime', () => {
  it('rounds reading time up at 200 words per minute', () => {
    expect(calculateReadingTime(0)).toBe(0)
    expect(calculateReadingTime(1)).toBe(1)
    expect(calculateReadingTime(200)).toBe(1)
    expect(calculateReadingTime(201)).toBe(2)
  })
})
