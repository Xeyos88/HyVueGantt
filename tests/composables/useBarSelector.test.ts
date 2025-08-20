import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import useBarSelector from '../../src/composables/useBarSelector'

describe('useBarSelector', () => {
  let barSelector: ReturnType<typeof useBarSelector>
  let ganttContainer: HTMLElement
  let barElement1: HTMLElement
  let barElement2: HTMLElement

  beforeEach(() => {
    barSelector = useBarSelector()
    
    // Create mock DOM structure
    ganttContainer = document.createElement('div')
    ganttContainer.id = 'test-gantt'
    
    barElement1 = document.createElement('div')
    barElement1.id = 'bar-1'
    barElement1.className = 'g-gantt-bar'
    
    barElement2 = document.createElement('div')
    barElement2.id = 'bar-2'
    barElement2.className = 'g-gantt-bar'
    
    ganttContainer.appendChild(barElement1)
    ganttContainer.appendChild(barElement2)
    document.body.appendChild(ganttContainer)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('findBarElement', () => {
    it('should find existing bar element', () => {
      const foundBar = barSelector.findBarElement('test-gantt', 'bar-1')
      expect(foundBar).toBe(barElement1)
    })

    it('should return null for non-existent bar', () => {
      const foundBar = barSelector.findBarElement('test-gantt', 'non-existent-bar')
      expect(foundBar).toBeNull()
    })

    it('should return null when gantt container does not exist', () => {
      const foundBar = barSelector.findBarElement('non-existent-gantt', 'bar-1')
      expect(foundBar).toBeNull()
    })

    it('should handle special characters in bar ID', () => {
      const specialBar = document.createElement('div')
      specialBar.id = 'bar:with.special#chars'
      specialBar.className = 'g-gantt-bar'
      ganttContainer.appendChild(specialBar)

      const foundBar = barSelector.findBarElement('test-gantt', 'bar:with.special#chars')
      expect(foundBar).toBe(specialBar)
    })

    it('should only search within specified gantt container', () => {
      // Create another gantt container with same bar ID
      const otherGantt = document.createElement('div')
      otherGantt.id = 'other-gantt'
      
      const otherBar = document.createElement('div')
      otherBar.id = 'bar-1'
      otherBar.className = 'g-gantt-bar'
      otherGantt.appendChild(otherBar)
      document.body.appendChild(otherGantt)

      const foundBar = barSelector.findBarElement('test-gantt', 'bar-1')
      expect(foundBar).toBe(barElement1)
      expect(foundBar).not.toBe(otherBar)
    })
  })

  describe('findAllBarElements', () => {
    it('should find all bar elements within gantt container', () => {
      const allBars = barSelector.findAllBarElements('test-gantt')
      expect(allBars).toHaveLength(2)
      expect(Array.from(allBars)).toContain(barElement1)
      expect(Array.from(allBars)).toContain(barElement2)
    })

    it('should return empty NodeList when gantt container does not exist', () => {
      const allBars = barSelector.findAllBarElements('non-existent-gantt')
      expect(allBars).toHaveLength(0)
    })

    it('should return empty NodeList when no bars exist', () => {
      const emptyGantt = document.createElement('div')
      emptyGantt.id = 'empty-gantt'
      document.body.appendChild(emptyGantt)

      const allBars = barSelector.findAllBarElements('empty-gantt')
      expect(allBars).toHaveLength(0)
    })

    it('should only find elements with g-gantt-bar class', () => {
      const nonBarElement = document.createElement('div')
      nonBarElement.id = 'not-a-bar'
      nonBarElement.className = 'some-other-class'
      ganttContainer.appendChild(nonBarElement)

      const allBars = barSelector.findAllBarElements('test-gantt')
      expect(allBars).toHaveLength(2)
      expect(Array.from(allBars)).not.toContain(nonBarElement)
    })

    it('should find bars in nested containers', () => {
      const nestedContainer = document.createElement('div')
      const nestedBar = document.createElement('div')
      nestedBar.id = 'nested-bar'
      nestedBar.className = 'g-gantt-bar'
      
      nestedContainer.appendChild(nestedBar)
      ganttContainer.appendChild(nestedContainer)

      const allBars = barSelector.findAllBarElements('test-gantt')
      expect(allBars).toHaveLength(3)
      expect(Array.from(allBars)).toContain(nestedBar)
    })
  })

  describe('barExistsInGantt', () => {
    it('should return true for existing bar', () => {
      const exists = barSelector.barExistsInGantt('test-gantt', 'bar-1')
      expect(exists).toBe(true)
    })

    it('should return false for non-existent bar', () => {
      const exists = barSelector.barExistsInGantt('test-gantt', 'non-existent-bar')
      expect(exists).toBe(false)
    })

    it('should return false when gantt container does not exist', () => {
      const exists = barSelector.barExistsInGantt('non-existent-gantt', 'bar-1')
      expect(exists).toBe(false)
    })

    it('should handle special characters in bar ID', () => {
      const specialBar = document.createElement('div')
      specialBar.id = 'bar@special!chars'
      specialBar.className = 'g-gantt-bar'
      ganttContainer.appendChild(specialBar)

      const exists = barSelector.barExistsInGantt('test-gantt', 'bar@special!chars')
      expect(exists).toBe(true)
    })
  })

  describe('CSS.escape usage', () => {
    it('should properly escape CSS selectors for querySelector', () => {
      const complexBar = document.createElement('div')
      complexBar.id = 'bar[0].item:first'
      complexBar.className = 'g-gantt-bar'
      ganttContainer.appendChild(complexBar)

      const foundBar = barSelector.findBarElement('test-gantt', 'bar[0].item:first')
      expect(foundBar).toBe(complexBar)
    })
  })
})