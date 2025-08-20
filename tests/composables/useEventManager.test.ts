import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, createApp } from 'vue'
import { useEventManager } from '../../src/composables/useEventManager'

describe('useEventManager', () => {
  let eventManager: ReturnType<typeof useEventManager>
  let mockElement: HTMLDivElement
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    // Create a Vue app context to avoid lifecycle warnings
    app = createApp({ template: '<div></div>' })
    app.mount(document.createElement('div'))
    
    // Run the composable within the Vue app context
    let manager: ReturnType<typeof useEventManager>
    app.runWithContext(() => {
      manager = useEventManager()
    })
    eventManager = manager!
    
    mockElement = document.createElement('div')
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (app) {
      app.unmount()
    }
  })

  describe('addEventListener', () => {
    it('should add event listener and return cleanup function', () => {
      const handler = vi.fn()
      const cleanup = eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler
      })

      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)

      cleanup()
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle function target', () => {
      const handler = vi.fn()
      const getTarget = vi.fn(() => mockElement)
      
      eventManager.addEventListener({
        target: getTarget,
        event: 'click',
        handler
      })

      expect(getTarget).toHaveBeenCalled()
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should return empty cleanup when target is null', () => {
      const handler = vi.fn()
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const cleanup = eventManager.addEventListener({
        target: () => null,
        event: 'click',
        handler
      })

      expect(consoleWarn).toHaveBeenCalledWith('Event target not available, skipping event listener registration')
      expect(cleanup).toBeInstanceOf(Function)
      
      consoleWarn.mockRestore()
    })

    it('should not track once events in registeredEvents', () => {
      const handler = vi.fn()
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler,
        once: true
      })

      const stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(0)
    })

    it('should support event listener options', () => {
      const handler = vi.fn()
      const addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener')
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler,
        options: { passive: true, capture: true }
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', handler, { passive: true, capture: true })
    })
  })

  describe('addEventListeners', () => {
    it('should add multiple event listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      const cleanupFunctions = eventManager.addEventListeners([
        { target: mockElement, event: 'click', handler: handler1 },
        { target: mockElement, event: 'mousedown', handler: handler2 }
      ])

      expect(cleanupFunctions).toHaveLength(2)
      
      mockElement.click()
      mockElement.dispatchEvent(new Event('mousedown'))
      
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('removeEventListener', () => {
    it('should remove specific event listener', () => {
      const handler = vi.fn()
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler
      })

      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)

      eventManager.removeEventListener(mockElement, 'click', handler)
      
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('removeAllListenersForTarget', () => {
    it('should remove all listeners for a specific target', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler: handler1
      })
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'mousedown',
        handler: handler2
      })

      let stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(2)

      eventManager.removeAllListenersForTarget(mockElement)

      stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(0)
    })
  })

  describe('createScopedManager', () => {
    it('should create scoped manager with element target', () => {
      const scoped = eventManager.createScopedManager(mockElement)
      const handler = vi.fn()
      
      scoped.on('click', handler)
      
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should create scoped manager with ref target', () => {
      const targetRef = ref<HTMLDivElement | null>(mockElement)
      const scoped = eventManager.createScopedManager(targetRef)
      const handler = vi.fn()
      
      scoped.on('click', handler)
      
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should create scoped manager with function target', () => {
      const getTarget = () => mockElement
      const scoped = eventManager.createScopedManager(getTarget)
      const handler = vi.fn()
      
      scoped.on('click', handler)
      
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support once method', () => {
      const scoped = eventManager.createScopedManager(mockElement)
      const handler = vi.fn()
      
      scoped.once('click', handler)
      
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
      
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support off method', () => {
      const scoped = eventManager.createScopedManager(mockElement)
      const handler = vi.fn()
      
      scoped.on('click', handler)
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
      
      scoped.off('click', handler)
      mockElement.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support cleanup method', () => {
      const scoped = eventManager.createScopedManager(mockElement)
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      scoped.on('click', handler1)
      scoped.on('mousedown', handler2)
      
      scoped.cleanup()
      
      const stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(0)
    })
  })

  describe('createEventPattern', () => {
    describe('mouseDrag', () => {
      it('should handle mouse drag pattern', () => {
        const onStart = vi.fn()
        const onMove = vi.fn()
        const onEnd = vi.fn()
        
        const cleanup = eventManager.createEventPattern.mouseDrag(
          mockElement,
          onStart,
          onMove,
          onEnd
        )

        const mouseDownEvent = new MouseEvent('mousedown')
        const mouseMoveEvent = new MouseEvent('mousemove')
        const mouseUpEvent = new MouseEvent('mouseup')

        mockElement.dispatchEvent(mouseDownEvent)
        expect(onStart).toHaveBeenCalledWith(mouseDownEvent)

        window.dispatchEvent(mouseMoveEvent)
        expect(onMove).toHaveBeenCalledWith(mouseMoveEvent)

        window.dispatchEvent(mouseUpEvent)
        expect(onEnd).toHaveBeenCalledWith(mouseUpEvent)

        cleanup()
      })

      it('should not trigger move/end without mousedown', () => {
        const onStart = vi.fn()
        const onMove = vi.fn()
        const onEnd = vi.fn()
        
        eventManager.createEventPattern.mouseDrag(
          mockElement,
          onStart,
          onMove,
          onEnd
        )

        window.dispatchEvent(new MouseEvent('mousemove'))
        window.dispatchEvent(new MouseEvent('mouseup'))
        
        expect(onMove).not.toHaveBeenCalled()
        expect(onEnd).not.toHaveBeenCalled()
      })
    })

    describe('touchDrag', () => {
      it('should handle touch drag pattern', () => {
        const onStart = vi.fn()
        const onMove = vi.fn()
        const onEnd = vi.fn()
        
        const cleanup = eventManager.createEventPattern.touchDrag(
          mockElement,
          onStart,
          onMove,
          onEnd
        )

        const touchStartEvent = new TouchEvent('touchstart')
        const touchMoveEvent = new TouchEvent('touchmove')
        const touchEndEvent = new TouchEvent('touchend')

        mockElement.dispatchEvent(touchStartEvent)
        expect(onStart).toHaveBeenCalledWith(touchStartEvent)

        mockElement.dispatchEvent(touchMoveEvent)
        expect(onMove).toHaveBeenCalledWith(touchMoveEvent)

        mockElement.dispatchEvent(touchEndEvent)
        expect(onEnd).toHaveBeenCalledWith(touchEndEvent)

        cleanup()
      })

      it('should handle touchcancel event', () => {
        const onStart = vi.fn()
        const onMove = vi.fn()
        const onEnd = vi.fn()
        
        eventManager.createEventPattern.touchDrag(
          mockElement,
          onStart,
          onMove,
          onEnd
        )

        mockElement.dispatchEvent(new TouchEvent('touchstart'))
        mockElement.dispatchEvent(new TouchEvent('touchcancel'))
        
        expect(onEnd).toHaveBeenCalled()
      })
    })
  })

  describe('cleanup', () => {
    it('should remove all registered event listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler: handler1
      })
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'mousedown',
        handler: handler2
      })

      let stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(2)

      eventManager.cleanup()

      stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(0)
      
      mockElement.click()
      mockElement.dispatchEvent(new Event('mousedown'))
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const handler = vi.fn()
      const element2 = document.createElement('div')
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler
      })
      
      eventManager.addEventListener({
        target: mockElement,
        event: 'click',
        handler
      })
      
      eventManager.addEventListener({
        target: element2,
        event: 'mousedown',
        handler
      })

      const stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(3)
      expect(stats.eventTypes.click).toBe(2)
      expect(stats.eventTypes.mousedown).toBe(1)
      expect(stats.targetsCount).toBe(2)
    })

    it('should return empty stats when no events registered', () => {
      const stats = eventManager.getStats()
      expect(stats.totalEvents).toBe(0)
      expect(stats.eventTypes).toEqual({})
      expect(stats.targetsCount).toBe(0)
    })
  })
})