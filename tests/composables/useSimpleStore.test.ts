import { describe, it, expect, beforeEach } from 'vitest'
import { ganttWidth } from '../../src/composables/useSimpleStore'

describe('useSimpleStore', () => {
  beforeEach(() => {
    ganttWidth.value = undefined
  })

  it('should initialize ganttWidth as undefined', () => {
    expect(ganttWidth.value).toBeUndefined()
  })

  it('should allow setting ganttWidth value', () => {
    ganttWidth.value = 800
    expect(ganttWidth.value).toBe(800)
  })

  it('should be reactive', () => {
    let observedValue: number | undefined
    
    const stopWatching = ganttWidth.value
    ganttWidth.value = 1200
    
    expect(ganttWidth.value).toBe(1200)
  })

  it('should maintain state across multiple accesses', () => {
    ganttWidth.value = 600
    
    const firstAccess = ganttWidth.value
    const secondAccess = ganttWidth.value
    
    expect(firstAccess).toBe(600)
    expect(secondAccess).toBe(600)
    expect(firstAccess).toBe(secondAccess)
  })

  it('should handle different value types', () => {
    ganttWidth.value = null
    expect(ganttWidth.value).toBeNull()
    
    ganttWidth.value = 0
    expect(ganttWidth.value).toBe(0)
    
    ganttWidth.value = 1920
    expect(ganttWidth.value).toBe(1920)
  })
})