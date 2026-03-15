import { describe, it, expect } from 'vitest'
import { cn, formatDuration, formatNumber } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      const result = cn('px-2', 'py-4', 'px-4')
      expect(result).toBe('py-4 px-4')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'block')
      expect(result).toBe('base block')
    })
  })

  describe('formatDuration', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDuration(65)).toBe('1:05')
      expect(formatDuration(125)).toBe('2:05')
    })

    it('should handle zero seconds', () => {
      expect(formatDuration(0)).toBe('0:00')
    })
  })

  describe('formatNumber', () => {
    it('should format thousands with K', () => {
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(1000)).toBe('1.0K')
    })

    it('should format millions with M', () => {
      expect(formatNumber(1500000)).toBe('1.5M')
    })

    it('should return number as is for small values', () => {
      expect(formatNumber(500)).toBe('500')
    })
  })
})
