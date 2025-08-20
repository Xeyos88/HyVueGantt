import { ref, onUnmounted, type Ref } from "vue"

/**
 * Interface for event listener configuration
 */
interface EventConfig {
  target: EventTarget | (() => EventTarget | null)
  event: string
  handler: EventListener
  options?: AddEventListenerOptions
  once?: boolean
}

/**
 * Interface for registered event listener tracking
 */
interface RegisteredEvent {
  target: EventTarget
  event: string
  handler: EventListener
  options?: AddEventListenerOptions
}

/**
 * A composable that manages event listeners across components
 * Provides automatic cleanup and centralized event management
 * @returns Object containing event management methods
 */
export function useEventManager() {
  // Track all registered events for cleanup
  const registeredEvents = ref(new Set<RegisteredEvent>())

  /**
   * Adds an event listener with automatic cleanup
   * @param config - Event configuration object
   * @returns Function to remove the specific event listener
   */
  const addEventListener = (config: EventConfig): (() => void) => {
    const target = typeof config.target === 'function' ? config.target() : config.target
    
    if (!target) {
      console.warn('Event target not available, skipping event listener registration')
      return () => {}
    }

    const registeredEvent: RegisteredEvent = {
      target,
      event: config.event,
      handler: config.handler,
      options: config.options
    }

    // Add the event listener with once option if specified
    const eventOptions = config.once 
      ? { ...config.options, once: true }
      : config.options
    target.addEventListener(config.event, config.handler, eventOptions)
    
    // Track for cleanup unless it's a one-time listener
    if (!config.once) {
      registeredEvents.value.add(registeredEvent)
    }

    // Return cleanup function
    return () => {
      target.removeEventListener(config.event, config.handler, config.options)
      registeredEvents.value.delete(registeredEvent)
    }
  }

  /**
   * Adds multiple event listeners at once
   * @param configs - Array of event configurations
   * @returns Array of cleanup functions
   */
  const addEventListeners = (configs: EventConfig[]): (() => void)[] => {
    return configs.map(config => addEventListener(config))
  }

  /**
   * Removes a specific event listener
   * @param target - Event target
   * @param event - Event name
   * @param handler - Event handler function
   * @param options - Event options (must match registration options)
   */
  const removeEventListener = (
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ) => {
    target.removeEventListener(event, handler, options)
    
    // Find and remove from tracking
    for (const registered of registeredEvents.value) {
      if (registered.target === target && 
          registered.event === event && 
          registered.handler === handler) {
        registeredEvents.value.delete(registered)
        break
      }
    }
  }

  /**
   * Removes all event listeners for a specific target
   * @param target - Event target to clean up
   */
  const removeAllListenersForTarget = (target: EventTarget) => {
    const toRemove = Array.from(registeredEvents.value).filter(
      registered => registered.target === target
    )

    toRemove.forEach(registered => {
      registered.target.removeEventListener(
        registered.event, 
        registered.handler, 
        registered.options
      )
      registeredEvents.value.delete(registered)
    })
  }

  /**
   * Creates a scoped event manager for a specific target
   * @param target - Default target for events, can be a ref or function
   * @returns Scoped event manager with target pre-configured
   */
  const createScopedManager = (target: EventTarget | Ref<EventTarget | null> | (() => EventTarget | null)) => {
    const getTarget = () => {
      if (typeof target === 'function') {
        return target()
      } else if (target && 'value' in target) {
        return target.value
      } else {
        return target as EventTarget
      }
    }

    return {
      on: (event: string, handler: EventListener, options?: AddEventListenerOptions) => {
        return addEventListener({
          target: getTarget,
          event,
          handler,
          options
        })
      },
      
      once: (event: string, handler: EventListener, options?: AddEventListenerOptions) => {
        return addEventListener({
          target: getTarget,
          event,
          handler,
          options,
          once: true
        })
      },

      off: (event: string, handler: EventListener, options?: AddEventListenerOptions) => {
        const currentTarget = getTarget()
        if (currentTarget) {
          removeEventListener(currentTarget, event, handler, options)
        }
      },

      cleanup: () => {
        const currentTarget = getTarget()
        if (currentTarget) {
          removeAllListenersForTarget(currentTarget)
        }
      }
    }
  }

  /**
   * Creates event listeners for common patterns
   */
  const createEventPattern = {
    /**
     * Mouse drag pattern (mousedown, mousemove, mouseup)
     */
    mouseDrag: (
      target: EventTarget | (() => EventTarget | null),
      onStart: (e: MouseEvent) => void,
      onMove: (e: MouseEvent) => void,
      onEnd: (e: MouseEvent) => void
    ) => {
      const cleanupFunctions: (() => void)[] = []
      let isDragging = false

      const handleMouseDown = (e: Event) => {
        isDragging = true
        onStart(e as MouseEvent)

        const handleMouseMove = (e: Event) => {
          if (isDragging) onMove(e as MouseEvent)
        }

        const handleMouseUp = (e: Event) => {
          if (isDragging) {
            isDragging = false
            onEnd(e as MouseEvent)
            moveCleanup()
            upCleanup()
          }
        }

        const moveCleanup = addEventListener({
          target: window,
          event: 'mousemove',
          handler: handleMouseMove
        })

        const upCleanup = addEventListener({
          target: window,
          event: 'mouseup',
          handler: handleMouseUp,
          once: true
        })
      }

      cleanupFunctions.push(addEventListener({
        target,
        event: 'mousedown',
        handler: handleMouseDown
      }))

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup())
      }
    },

    /**
     * Touch drag pattern (touchstart, touchmove, touchend)
     */
    touchDrag: (
      target: EventTarget | (() => EventTarget | null),
      onStart: (e: TouchEvent) => void,
      onMove: (e: TouchEvent) => void,
      onEnd: (e: TouchEvent) => void
    ) => {
      const cleanupFunctions: (() => void)[] = []
      let isDragging = false

      const handleTouchStart = (e: Event) => {
        isDragging = true
        onStart(e as TouchEvent)
      }

      const handleTouchMove = (e: Event) => {
        if (isDragging) onMove(e as TouchEvent)
      }

      const handleTouchEnd = (e: Event) => {
        if (isDragging) {
          isDragging = false
          onEnd(e as TouchEvent)
        }
      }

      cleanupFunctions.push(...addEventListeners([
        { target, event: 'touchstart', handler: handleTouchStart },
        { target, event: 'touchmove', handler: handleTouchMove },
        { target, event: 'touchend', handler: handleTouchEnd },
        { target, event: 'touchcancel', handler: handleTouchEnd }
      ]))

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup())
      }
    }
  }

  /**
   * Cleans up all registered event listeners
   */
  const cleanup = () => {
    registeredEvents.value.forEach(registered => {
      registered.target.removeEventListener(
        registered.event,
        registered.handler,
        registered.options
      )
    })
    registeredEvents.value.clear()
  }

  /**
   * Gets statistics about registered events for debugging
   */
  const getStats = () => {
    const eventStats = new Map<string, number>()
    const targetStats = new Map<EventTarget, number>()

    registeredEvents.value.forEach(registered => {
      // Count by event type
      eventStats.set(registered.event, (eventStats.get(registered.event) || 0) + 1)
      
      // Count by target
      targetStats.set(registered.target, (targetStats.get(registered.target) || 0) + 1)
    })

    return {
      totalEvents: registeredEvents.value.size,
      eventTypes: Object.fromEntries(eventStats),
      targetsCount: targetStats.size
    }
  }

  // Auto cleanup on component unmount
  onUnmounted(cleanup)

  return {
    addEventListener,
    addEventListeners,
    removeEventListener,
    removeAllListenersForTarget,
    createScopedManager,
    createEventPattern,
    cleanup,
    getStats
  }
}