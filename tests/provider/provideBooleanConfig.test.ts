import { describe, it, expect } from 'vitest'
import { provide } from 'vue'
import { mount } from '@vue/test-utils'
import provideBooleanConfig from '../../src/provider/provideBooleanConfig'
import { BOOLEAN_KEY } from '../../src/provider/symbols'

describe('provideBooleanConfig', () => {
  it('should inject and return boolean config when provided', () => {
    const mockConfig = {
      enableDrag: true,
      enableResize: false,
      showTooltips: true
    }

    const TestComponent = {
      setup() {
        const config = provideBooleanConfig()
        return { config }
      },
      template: '<div>{{ config.enableDrag }}</div>'
    }

    const ParentComponent = {
      setup() {
        provide(BOOLEAN_KEY, mockConfig)
      },
      components: { TestComponent },
      template: '<TestComponent />'
    }

    const wrapper = mount(ParentComponent)
    expect(wrapper.text()).toBe('true')
  })

  it('should throw error when config is not provided', () => {
    const TestComponent = {
      setup() {
        return { config: provideBooleanConfig() }
      },
      template: '<div>{{ config }}</div>'
    }

    expect(() => {
      mount(TestComponent)
    }).toThrow('Failed to inject config!')
  })

  it('should throw error when config is null', () => {
    const TestComponent = {
      setup() {
        return { config: provideBooleanConfig() }
      },
      template: '<div>{{ config }}</div>'
    }

    const ParentComponent = {
      setup() {
        provide(BOOLEAN_KEY, null)
      },
      components: { TestComponent },
      template: '<TestComponent />'
    }

    expect(() => {
      mount(ParentComponent)
    }).toThrow('Failed to inject config!')
  })

  it('should throw error when config is undefined', () => {
    const TestComponent = {
      setup() {
        return { config: provideBooleanConfig() }
      },
      template: '<div>{{ config }}</div>'
    }

    const ParentComponent = {
      setup() {
        provide(BOOLEAN_KEY, undefined)
      },
      components: { TestComponent },
      template: '<TestComponent />'
    }

    expect(() => {
      mount(ParentComponent)
    }).toThrow('Failed to inject config!')
  })

  it('should return the complete config object', () => {
    const mockConfig = {
      option1: true,
      option2: false,
      option3: true,
      nestedOption: {
        subOption: false
      }
    }

    let injectedConfig: any

    const TestComponent = {
      setup() {
        injectedConfig = provideBooleanConfig()
        return {}
      },
      template: '<div></div>'
    }

    const ParentComponent = {
      setup() {
        provide(BOOLEAN_KEY, mockConfig)
      },
      components: { TestComponent },
      template: '<TestComponent />'
    }

    mount(ParentComponent)
    expect(injectedConfig).toEqual(mockConfig)
  })
})