import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp } from 'vue'
import { useObjectPool } from '../../src/composables/useObjectPool'
import type { ObjectFactory } from '../../src/composables/useObjectPool'

describe('useObjectPool', () => {
  let objectPool: ReturnType<typeof useObjectPool>
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    // Create a Vue app context to avoid lifecycle warnings
    app = createApp({ template: '<div></div>' })
    app.mount(document.createElement('div'))
    
    // Run the composable within the Vue app context
    let pool: ReturnType<typeof useObjectPool>
    app.runWithContext(() => {
      pool = useObjectPool()
    })
    objectPool = pool!
    
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    objectPool.destroyAllPools()
    if (app) {
      app.unmount()
    }
  })

  describe('createPool', () => {
    it('should create a new pool with factory', () => {
      const factory = {
        create: () => ({ value: 0 }),
        reset: (obj: { value: number }) => { obj.value = 0 }
      }

      const pool = objectPool.createPool('test', factory)
      expect(pool).toBeDefined()

      const obj = pool.acquire()
      expect(obj).toEqual({ value: 0 })

      pool.release(obj)
    })

    it('should return existing pool if name already exists', () => {
      const factory = {
        create: () => ({ value: 0 }),
        reset: (obj: { value: number }) => { obj.value = 0 }
      }

      const pool1 = objectPool.createPool('test-unique', factory)
      const pool2 = objectPool.createPool('test-unique', factory)

      // Test behavior instead of reference equality - both should be the same pool
      const obj1 = pool1.acquire()
      const obj2 = pool2.acquire()
      
      // If they're the same pool, the stats should show both objects are in use
      const stats = pool1.getStats()
      expect(stats.inUse).toBe(2)
      
      // Release objects back
      pool1.release(obj1)
      pool2.release(obj2)
    })

    it('should create pool with custom config', () => {
      const factory = {
        create: () => ({ value: 0 }),
        reset: (obj: { value: number }) => { obj.value = 0 }
      }

      const pool = objectPool.createPool('test', factory, {
        maxSize: 10,
        initialSize: 3,
        cleanupInterval: 5000
      })

      const stats = pool.getStats()
      expect(stats.maxSize).toBe(10)
      expect(stats.available).toBe(3)
    })
  })

  describe('ObjectPool class functionality', () => {
    let pool: ReturnType<typeof objectPool.createPool<{ value: number; id: string }>>

    beforeEach(() => {
      const factory = {
        create: () => ({ value: 0, id: '' }),
        reset: (obj: { value: number; id: string }) => {
          obj.value = 0
          obj.id = ''
        }
      }
      pool = objectPool.createPool('test', factory, { initialSize: 2, maxSize: 5 })
    })

    it('should acquire objects from pool', () => {
      const obj = pool.acquire()
      expect(obj).toEqual({ value: 0, id: '' })

      const stats = pool.getStats()
      expect(stats.inUse).toBe(1)
      expect(stats.available).toBe(1)
    })

    it('should create new objects when pool is empty', () => {
      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      const obj3 = pool.acquire() // Should create new since pool is empty

      expect(obj3).toEqual({ value: 0, id: '' })

      const stats = pool.getStats()
      expect(stats.inUse).toBe(3)
      expect(stats.available).toBe(0)
    })

    it('should release objects back to pool', () => {
      const obj = pool.acquire()
      obj.value = 42
      obj.id = 'test'

      pool.release(obj)

      expect(obj.value).toBe(0) // Should be reset
      expect(obj.id).toBe('')

      const stats = pool.getStats()
      expect(stats.inUse).toBe(0)
      expect(stats.available).toBe(2) // Back to initial size
    })

    it('should ignore release of objects not from pool', () => {
      const externalObj = { value: 100, id: 'external' }
      
      pool.release(externalObj)

      const stats = pool.getStats()
      expect(stats.available).toBe(2) // Should not change
    })

    it('should not exceed max size when releasing objects', () => {
      const objects: any[] = []
      
      // Acquire more objects than max size
      for (let i = 0; i < 7; i++) {
        objects.push(pool.acquire())
      }

      // Release all objects
      objects.forEach(obj => pool.release(obj))

      const stats = pool.getStats()
      expect(stats.available).toBe(5) // Max size limit
    })

    it('should handle object validation', () => {
      const factoryWithValidator = {
        create: () => ({ value: 0, valid: true }),
        reset: (obj: { value: number; valid: boolean }) => {
          obj.value = 0
          obj.valid = true
        },
        validate: (obj: { value: number; valid: boolean }) => obj.valid
      }

      const validatedPool = objectPool.createPool('validated', factoryWithValidator)
      
      const obj = validatedPool.acquire()
      obj.valid = false
      validatedPool.release(obj)

      // Next acquire should create new object since validation fails
      const newObj = validatedPool.acquire()
      expect(newObj.valid).toBe(true)
    })

    it('should cleanup excess objects periodically', () => {
      const factory = {
        create: () => ({ value: Math.random() }),
        reset: (obj: { value: number }) => { obj.value = 0 }
      }

      const cleanupPool = objectPool.createPool('cleanup', factory, {
        maxSize: 10,
        cleanupInterval: 1000
      })

      // Fill pool to max capacity
      const objects = []
      for (let i = 0; i < 15; i++) {
        objects.push(cleanupPool.acquire())
      }
      objects.forEach(obj => cleanupPool.release(obj))

      let stats = cleanupPool.getStats()
      expect(stats.available).toBe(10)

      // Trigger cleanup
      vi.advanceTimersByTime(1000)

      stats = cleanupPool.getStats()
      expect(stats.available).toBe(5) // Should be half of max size
    })
  })

  describe('specialized pools', () => {
    describe('createConnectionPositionPool', () => {
      it('should create connection position pool with correct defaults', () => {
        const pool = objectPool.createConnectionPositionPool()
        const obj = pool.acquire()

        expect(obj).toEqual({
          sourceX: 0,
          sourceY: 0,
          targetX: 0,
          targetY: 0,
          width: 0,
          height: 0
        })

        obj.sourceX = 100
        obj.width = 50
        pool.release(obj)

        const newObj = pool.acquire()
        expect(newObj.sourceX).toBe(0) // Should be reset
        expect(newObj.width).toBe(0)
      })
    })

    describe('createMouseEventPool', () => {
      it('should create mouse event pool with correct defaults', () => {
        const pool = objectPool.createMouseEventPool()
        const obj = pool.acquire()

        expect(obj).toEqual({
          type: '',
          clientX: 0,
          clientY: 0,
          button: 0,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          target: null
        })

        obj.type = 'click'
        obj.clientX = 100
        obj.ctrlKey = true
        pool.release(obj)

        const newObj = pool.acquire()
        expect(newObj.type).toBe('')
        expect(newObj.clientX).toBe(0)
        expect(newObj.ctrlKey).toBe(false)
      })
    })

    describe('createBarPositionPool', () => {
      it('should create bar position pool with correct defaults', () => {
        const pool = objectPool.createBarPositionPool()
        const obj = pool.acquire()

        expect(obj).toEqual({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          id: ''
        })

        obj.x = 50
        obj.id = 'test-bar'
        pool.release(obj)

        const newObj = pool.acquire()
        expect(newObj.x).toBe(0)
        expect(newObj.id).toBe('')
      })
    })

    describe('createArrayPool', () => {
      it('should create array pool that resets array length', () => {
        const pool = objectPool.createArrayPool<number>('numbers')
        const arr = pool.acquire()

        arr.push(1, 2, 3, 4, 5)
        expect(arr.length).toBe(5)

        pool.release(arr)
        
        const newArr = pool.acquire()
        expect(newArr.length).toBe(0)
      })
    })
  })

  describe('pool management', () => {
    it('should get statistics for all pools', () => {
      objectPool.createConnectionPositionPool()
      objectPool.createMouseEventPool()
      
      const stats = objectPool.getAllStats()
      
      expect(stats.connectionPosition).toBeDefined()
      expect(stats.mouseEvent).toBeDefined()
      expect(stats.connectionPosition.available).toBe(10)
      expect(stats.mouseEvent.available).toBe(5)
    })

    it('should destroy specific pool', () => {
      const pool = objectPool.createConnectionPositionPool()
      
      let stats = objectPool.getAllStats()
      expect(stats.connectionPosition).toBeDefined()
      
      objectPool.destroyPool('connectionPosition')
      
      stats = objectPool.getAllStats()
      expect(stats.connectionPosition).toBeUndefined()
    })

    it('should destroy all pools', () => {
      objectPool.createConnectionPositionPool()
      objectPool.createMouseEventPool()
      objectPool.createBarPositionPool()
      
      let stats = objectPool.getAllStats()
      expect(Object.keys(stats)).toHaveLength(3)
      
      objectPool.destroyAllPools()
      
      stats = objectPool.getAllStats()
      expect(Object.keys(stats)).toHaveLength(0)
    })

    it('should handle destroying non-existent pool gracefully', () => {
      expect(() => {
        objectPool.destroyPool('nonexistent')
      }).not.toThrow()
    })
  })

  describe('pool lifecycle', () => {
    it('should clean up timers when pool is destroyed', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      
      const pool = objectPool.createPool('timer-test', {
        create: () => ({}),
        reset: () => {}
      }, { cleanupInterval: 1000 })

      objectPool.destroyPool('timer-test')
      
      expect(clearIntervalSpy).toHaveBeenCalled()
      clearIntervalSpy.mockRestore()
    })

    it('should not set cleanup timer when cleanupInterval is 0', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      
      // Create pool with cleanupInterval 0
      const pool = objectPool.createPool('no-timer', {
        create: () => ({}),
        reset: () => {}
      }, { cleanupInterval: 0 })
      
      // Check that no setInterval calls were made with interval 0
      const zeroIntervalCalls = setIntervalSpy.mock.calls.filter(call => call[1] === 0)
      expect(zeroIntervalCalls).toHaveLength(0)
      
      setIntervalSpy.mockRestore()
    })
  })
})