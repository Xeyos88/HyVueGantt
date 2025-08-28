import { describe, it, expect, beforeEach } from 'vitest'
import { useConnectionPositionCache } from '../../src/composables/useConnectionPositionCache'
import type { BarConnection } from '../../src/types'

describe('useConnectionPositionCache', () => {
  let cache: ReturnType<typeof useConnectionPositionCache>

  beforeEach(() => {
    cache = useConnectionPositionCache()
  })

  it('should initialize with empty cache', () => {
    const stats = cache.getCacheStats()
    expect(stats.connectionCacheSize).toBe(0)
    expect(stats.barPositionCacheSize).toBe(0)
    expect(stats.cacheVersion).toBe(0)
  })

  describe('updateBarPosition', () => {
    it('should add new bar position to cache', () => {
      const barPosition = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      cache.updateBarPosition('bar1', barPosition)

      const stats = cache.getCacheStats()
      expect(stats.barPositionCacheSize).toBe(1)
    })

    it('should not update cache if position has not changed', () => {
      const barPosition = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      cache.updateBarPosition('bar1', barPosition)
      const statsAfterFirst = cache.getCacheStats()
      
      cache.updateBarPosition('bar1', barPosition)
      const statsAfterSecond = cache.getCacheStats()

      expect(statsAfterFirst.barPositionCacheSize).toBe(statsAfterSecond.barPositionCacheSize)
    })

    it('should invalidate related connections when bar position changes', () => {
      const connection: BarConnection = {
        sourceId: 'bar1',
        targetId: 'bar2',
        relation: 'FS'
      }

      const sourceBar = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      const targetBar = {
        id: 'bar2',
        x: 350,
        y: 80,
        width: 150,
        height: 30
      }

      cache.getConnectionPosition(connection, sourceBar, targetBar)
      let stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(1)

      cache.updateBarPosition('bar1', {
        ...sourceBar,
        x: 150
      })

      stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(0)
    })
  })

  describe('getConnectionPosition', () => {
    it('should calculate connection position for FS relation', () => {
      const connection: BarConnection = {
        sourceId: 'bar1',
        targetId: 'bar2',
        relation: 'FS'
      }

      const sourceBar = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      const targetBar = {
        id: 'bar2',
        x: 350,
        y: 80,
        width: 150,
        height: 30
      }

      const position = cache.getConnectionPosition(connection, sourceBar, targetBar)

      expect(position.sourceX).toBe(300) // sourceBar.x + sourceBar.width
      expect(position.sourceY).toBe(65) // sourceBar.y + sourceBar.height / 2
      expect(position.targetX).toBe(350) // targetBar.x
      expect(position.targetY).toBe(95) // targetBar.y + targetBar.height / 2
      expect(position.width).toBe(50)
      expect(position.height).toBe(30)
    })

    it('should calculate connection position for SS relation', () => {
      const connection: BarConnection = {
        sourceId: 'bar1',
        targetId: 'bar2',
        relation: 'SS'
      }

      const sourceBar = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      const targetBar = {
        id: 'bar2',
        x: 350,
        y: 80,
        width: 150,
        height: 30
      }

      const position = cache.getConnectionPosition(connection, sourceBar, targetBar)

      expect(position.sourceX).toBe(100) // sourceBar.x
      expect(position.targetX).toBe(350) // targetBar.x
    })

    it('should cache calculated positions', () => {
      const connection: BarConnection = {
        sourceId: 'bar1',
        targetId: 'bar2',
        relation: 'FS'
      }

      const sourceBar = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      const targetBar = {
        id: 'bar2',
        x: 350,
        y: 80,
        width: 150,
        height: 30
      }

      cache.getConnectionPosition(connection, sourceBar, targetBar)
      const stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(1)

      const position2 = cache.getConnectionPosition(connection, sourceBar, targetBar)
      expect(position2.sourceX).toBe(300)
    })

    it('should limit cache size to prevent memory leaks', () => {
      const sourceBar = {
        id: 'source',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      const targetBar = {
        id: 'target',
        x: 350,
        y: 80,
        width: 150,
        height: 30
      }

      for (let i = 0; i <= 505; i++) {
        const connection: BarConnection = {
          sourceId: `bar${i}`,
          targetId: `bar${i + 1}`,
          relation: 'FS'
        }
        cache.getConnectionPosition(connection, sourceBar, targetBar)
      }

      const stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBeLessThanOrEqual(500)
    })
  })

  describe('invalidateCache', () => {
    it('should clear all caches and increment version', () => {
      const connection: BarConnection = {
        sourceId: 'bar1',
        targetId: 'bar2',
        relation: 'FS'
      }

      const sourceBar = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      const targetBar = {
        id: 'bar2',
        x: 350,
        y: 80,
        width: 150,
        height: 30
      }

      cache.getConnectionPosition(connection, sourceBar, targetBar)
      // Don't call updateBarPosition, just test invalidateCache directly

      let stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(1)
      expect(stats.barPositionCacheSize).toBe(0) // No bar position cached yet
      const initialVersion = stats.cacheVersion

      cache.invalidateCache()

      stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(0)
      expect(stats.barPositionCacheSize).toBe(0)
      expect(stats.cacheVersion).toBe(initialVersion + 1)
    })
  })

  describe('cleanupCache', () => {
    it('should remove old versioned cache entries', () => {
      const connection: BarConnection = {
        sourceId: 'bar1',
        targetId: 'bar2',
        relation: 'FS'
      }

      const sourceBar = {
        id: 'bar1',
        x: 100,
        y: 50,
        width: 200,
        height: 30
      }

      const targetBar = {
        id: 'bar2',
        x: 350,
        y: 80,
        width: 150,
        height: 30
      }

      cache.getConnectionPosition(connection, sourceBar, targetBar)
      let stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(1)

      cache.invalidateCache()

      cache.getConnectionPosition(connection, sourceBar, targetBar)
      stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(1)

      cache.cleanupCache()

      stats = cache.getCacheStats()
      expect(stats.connectionCacheSize).toBe(1)
    })
  })
})