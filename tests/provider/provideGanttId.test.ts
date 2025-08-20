import { describe, it, expect } from 'vitest'
import { provide } from 'vue'
import { mount } from '@vue/test-utils'
import provideGanttId from '../../src/provider/provideGanttId'
import { GANTT_ID_KEY } from '../../src/provider/symbols'

describe('provideGanttId', () => {
  it('should inject and return ganttId when provided', () => {
    const TestComponent = {
      setup() {
        const ganttId = provideGanttId()
        return { ganttId }
      },
      template: '<div>{{ ganttId }}</div>'
    }

    const ParentComponent = {
      setup() {
        provide(GANTT_ID_KEY, 'test-gantt-123')
      },
      components: { TestComponent },
      template: '<TestComponent />'
    }

    const wrapper = mount(ParentComponent)
    expect(wrapper.text()).toBe('test-gantt-123')
  })

  it('should throw error when ganttId is not provided', () => {
    // Test directly without Vue component wrapper, since inject() will fail outside component context
    expect(() => {
      provideGanttId()
    }).toThrow('Failed to inject ganttId!')
  })

  it('should throw error when ganttId is null', () => {
    const TestComponent = {
      setup() {
        return { ganttId: provideGanttId() }
      },
      template: '<div>{{ ganttId }}</div>'
    }

    const ParentComponent = {
      setup() {
        provide(GANTT_ID_KEY, null)
      },
      components: { TestComponent },
      template: '<TestComponent />'
    }

    expect(() => {
      mount(ParentComponent)
    }).toThrow('Failed to inject ganttId!')
  })

  it('should throw error when ganttId is undefined', () => {
    const TestComponent = {
      setup() {
        return { ganttId: provideGanttId() }
      },
      template: '<div>{{ ganttId }}</div>'
    }

    const ParentComponent = {
      setup() {
        provide(GANTT_ID_KEY, undefined)
      },
      components: { TestComponent },
      template: '<TestComponent />'
    }

    expect(() => {
      mount(ParentComponent)
    }).toThrow('Failed to inject ganttId!')
  })
})