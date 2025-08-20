import { ref } from "vue"
import type { BarConnection } from "../types"

/**
 * Interface for cached connection position data
 */
interface ConnectionPositionData {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  width: number
  height: number
}

/**
 * Interface for bar position data used in calculations
 */
interface BarPositionInfo {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * A composable that provides memoized connection position calculations
 * Significantly improves performance when rendering many connections
 * @returns Object containing cached connection position methods
 */
export function useConnectionPositionCache() {
  // Cache for connection positions
  const connectionCache = ref(new Map<string, ConnectionPositionData>())
  
  // Cache for bar positions to detect changes
  const barPositionCache = ref(new Map<string, BarPositionInfo>())
  
  // Version counter to track cache validity
  const cacheVersion = ref(0)

  /**
   * Generates a cache key for a connection
   * @param sourceId - Source bar ID
   * @param targetId - Target bar ID
   * @returns Cache key string
   */
  const getConnectionCacheKey = (sourceId: string, targetId: string): string => {
    return `${sourceId}-${targetId}-v${cacheVersion.value}`
  }

  /**
   * Updates bar position in cache and invalidates related connections
   * @param barId - ID of the bar
   * @param position - New position data
   */
  const updateBarPosition = (barId: string, position: BarPositionInfo) => {
    const existing = barPositionCache.value.get(barId)
    
    // Check if position actually changed
    if (existing && 
        existing.x === position.x && 
        existing.y === position.y &&
        existing.width === position.width && 
        existing.height === position.height) {
      return // No change, no need to update
    }

    // Update bar position
    barPositionCache.value.set(barId, position)
    
    // Invalidate connections involving this bar
    const connectionsToInvalidate: string[] = []
    
    for (const [key] of connectionCache.value) {
      if (key.includes(barId)) {
        connectionsToInvalidate.push(key)
      }
    }
    
    connectionsToInvalidate.forEach(key => {
      connectionCache.value.delete(key)
    })
  }

  /**
   * Gets cached connection position or calculates and caches if not found
   * @param connection - Connection object
   * @param sourceBar - Source bar position info
   * @param targetBar - Target bar position info
   * @returns Cached or calculated connection position data
   */
  const getConnectionPosition = (
    connection: BarConnection,
    sourceBar: BarPositionInfo,
    targetBar: BarPositionInfo
  ): ConnectionPositionData => {
    const cacheKey = getConnectionCacheKey(connection.sourceId, connection.targetId)
    
    // Check cache first
    const cached = connectionCache.value.get(cacheKey)
    if (cached) {
      return cached
    }

    // Calculate connection position
    const sourceX = connection.relation?.startsWith('F') ? 
      sourceBar.x + sourceBar.width : sourceBar.x
    const sourceY = sourceBar.y + sourceBar.height / 2

    const targetX = connection.relation?.endsWith('S') ? 
      targetBar.x : targetBar.x + targetBar.width
    const targetY = targetBar.y + targetBar.height / 2

    const positionData: ConnectionPositionData = {
      sourceX,
      sourceY,
      targetX,
      targetY,
      width: Math.abs(targetX - sourceX),
      height: Math.abs(targetY - sourceY)
    }

    // Cache the result
    connectionCache.value.set(cacheKey, positionData)

    // Limit cache size to prevent memory leaks
    if (connectionCache.value.size > 500) {
      const oldestKey = connectionCache.value.keys().next().value
      if (oldestKey) {
        connectionCache.value.delete(oldestKey)
      }
    }

    return positionData
  }

  /**
   * Invalidates entire cache (useful when chart layout changes significantly)
   */
  const invalidateCache = () => {
    cacheVersion.value++
    connectionCache.value.clear()
    barPositionCache.value.clear()
  }

  /**
   * Clears old cache entries based on version
   */
  const cleanupCache = () => {
    const currentVersion = cacheVersion.value
    const keysToDelete: string[] = []

    for (const [key] of connectionCache.value) {
      const keyVersion = parseInt(key.split('-v')[1] || '0')
      if (keyVersion < currentVersion) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => connectionCache.value.delete(key))
  }

  /**
   * Gets cache statistics for debugging
   */
  const getCacheStats = () => {
    return {
      connectionCacheSize: connectionCache.value.size,
      barPositionCacheSize: barPositionCache.value.size,
      cacheVersion: cacheVersion.value
    }
  }

  return {
    updateBarPosition,
    getConnectionPosition,
    invalidateCache,
    cleanupCache,
    getCacheStats
  }
}