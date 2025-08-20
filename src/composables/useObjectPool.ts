import { ref, onUnmounted } from "vue"

/**
 * Interface for a poolable object factory
 */
export interface ObjectFactory<T> {
  create: () => T
  reset: (obj: T) => void
  validate?: (obj: T) => boolean
}

/**
 * Interface for pool configuration
 */
interface PoolConfig {
  maxSize?: number
  initialSize?: number
  cleanupInterval?: number
}

/**
 * Interface for connection position data used in pools
 */
export interface ConnectionPositionData {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  width: number
  height: number
}

/**
 * Interface for mouse event data used in pools
 */
export interface PooledMouseEventData {
  type: string
  clientX: number
  clientY: number
  button: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  target: EventTarget | null
}

/**
 * Interface for bar position data used in pools
 */
export interface BarPositionData {
  x: number
  y: number
  width: number
  height: number
  id: string
}

/**
 * Generic object pool implementation
 */
class ObjectPool<T> {
  private available: T[] = []
  private inUse = new Set<T>()
  private factory: ObjectFactory<T>
  private maxSize: number
  private cleanupInterval: number
  private cleanupTimer?: NodeJS.Timeout

  constructor(factory: ObjectFactory<T>, config: PoolConfig = {}) {
    this.factory = factory
    this.maxSize = config.maxSize || 50
    this.cleanupInterval = config.cleanupInterval || 60000 // 1 minute

    // Pre-populate pool
    const initialSize = config.initialSize || Math.min(5, this.maxSize)
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory.create())
    }

    // Setup cleanup timer
    if (this.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup()
      }, this.cleanupInterval)
    }
  }

  /**
   * Gets an object from the pool
   */
  acquire(): T {
    let obj = this.available.pop()
    
    if (!obj) {
      obj = this.factory.create()
    }

    // Validate object if validator exists
    if (this.factory.validate && !this.factory.validate(obj)) {
      obj = this.factory.create()
    }

    this.inUse.add(obj)
    return obj
  }

  /**
   * Returns an object to the pool
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      return // Object not from this pool
    }

    this.inUse.delete(obj)
    
    // Reset object state
    this.factory.reset(obj)
    
    // Add back to available pool if under max size
    if (this.available.length < this.maxSize) {
      this.available.push(obj)
    }
  }

  /**
   * Cleans up excess objects from the pool
   */
  private cleanup(): void {
    // Keep only half the objects if pool is at max capacity
    if (this.available.length >= this.maxSize) {
      const keepCount = Math.floor(this.maxSize / 2)
      this.available = this.available.slice(0, keepCount)
    }
  }

  /**
   * Gets pool statistics
   */
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      maxSize: this.maxSize
    }
  }

  /**
   * Destroys the pool and cleans up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    
    this.available.length = 0
    this.inUse.clear()
  }
}

/**
 * A composable that provides object pooling for frequently created objects
 * Helps reduce garbage collection pressure and improve performance
 */
export function useObjectPool() {
  const pools = ref(new Map<string, ObjectPool<any>>())

  /**
   * Creates or gets an existing object pool
   */
  const createPool = <T>(
    name: string,
    factory: ObjectFactory<T>,
    config?: PoolConfig
  ): ObjectPool<T> => {
    if (pools.value.has(name)) {
      return pools.value.get(name) as ObjectPool<T>
    }

    const pool = new ObjectPool(factory, config)
    pools.value.set(name, pool)
    return pool
  }

  /**
   * Creates a pool for connection position objects
   */
  const createConnectionPositionPool = () => {
    return createPool<ConnectionPositionData>('connectionPosition', {
      create: () => ({
        sourceX: 0,
        sourceY: 0,
        targetX: 0,
        targetY: 0,
        width: 0,
        height: 0
      }),
      reset: (obj) => {
        obj.sourceX = 0
        obj.sourceY = 0
        obj.targetX = 0
        obj.targetY = 0
        obj.width = 0
        obj.height = 0
      }
    }, { maxSize: 100, initialSize: 10 })
  }

  /**
   * Creates a pool for mouse event objects
   */
  const createMouseEventPool = () => {
    return createPool<PooledMouseEventData>('mouseEvent', {
      create: () => ({
        type: '',
        clientX: 0,
        clientY: 0,
        button: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        target: null
      }),
      reset: (obj) => {
        obj.type = ''
        obj.clientX = 0
        obj.clientY = 0
        obj.button = 0
        obj.ctrlKey = false
        obj.shiftKey = false
        obj.altKey = false
        obj.metaKey = false
        obj.target = null
      }
    }, { maxSize: 50, initialSize: 5 })
  }

  /**
   * Creates a pool for bar position calculation objects
   */
  const createBarPositionPool = () => {
    return createPool<BarPositionData>('barPosition', {
      create: () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        id: ''
      }),
      reset: (obj) => {
        obj.x = 0
        obj.y = 0
        obj.width = 0
        obj.height = 0
        obj.id = ''
      }
    }, { maxSize: 200, initialSize: 20 })
  }

  /**
   * Creates a pool for temporary array objects
   */
  const createArrayPool = <T>(name: string, maxSize: number = 50) => {
    return createPool<T[]>(`array-${name}`, {
      create: () => [],
      reset: (obj) => {
        obj.length = 0 // Clear array efficiently
      }
    }, { maxSize, initialSize: 5 })
  }

  /**
   * Gets statistics for all pools
   */
  const getAllStats = () => {
    const stats: Record<string, any> = {}
    
    for (const [name, pool] of pools.value) {
      stats[name] = pool.getStats()
    }
    
    return stats
  }

  /**
   * Destroys a specific pool
   */
  const destroyPool = (name: string) => {
    const pool = pools.value.get(name)
    if (pool) {
      pool.destroy()
      pools.value.delete(name)
    }
  }

  /**
   * Destroys all pools
   */
  const destroyAllPools = () => {
    for (const [_name, pool] of pools.value) {
      pool.destroy()
    }
    pools.value.clear()
  }

  // Cleanup on component unmount
  onUnmounted(destroyAllPools)

  return {
    createPool,
    createConnectionPositionPool,
    createMouseEventPool,
    createBarPositionPool,
    createArrayPool,
    getAllStats,
    destroyPool,
    destroyAllPools
  }
}