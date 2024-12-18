import { defineConfig } from "vitepress"

export default defineConfig({
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.includes('hy-vue-')
      }
    }
  },
  lang: 'en-US',
  title: "Hyper Vue Gantt",
  description: "Documentation for the Huper Vue Gantt Chart Library",
  base: '/hy-vue-gantt/',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

  themeConfig: {
    logo: {
      src: '/logo.png',
      alt: 'Hyper Vue Gantt Logo'
    },

    nav: [
      { text: "Home", link: "/" },
      {
        text: "Links",
        items: [
          { text: "GitHub", link: "https://github.com/Xeyos88/HyVueGantt" },
          { text: "NPM", link: "https://www.npmjs.com/package/hy-vue-gantt" }
        ]
      }
    ],

    sidebar: {
      "/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" }
          ]
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Chart Configuration", link: "/guide/chart-configuration" },
            { text: "Time Axis", link: "/guide/time-axis" },
            { text: "Connections", link: "/guide/connections" },
            { text: "Styling", link: "/guide/styling" }
          ]
        },
        {
          text: "Components",
          items: [
            { text: "GGanttChart", link: "/components/g-gantt-chart" },
            { text: "GGanttRow", link: "/components/g-gantt-row" }
          ]
        },
        {
          text: "API Reference",
          items: [
            { text: "Props", link: "/api/props" },
            { text: "Events", link: "/api/events" },
            { text: "Types", link: "/api/types" },
            { text: "Color Schemes", link: "/api/color-schemes" }
          ]
        },
        {
          text: "Examples",
          items: [
            { text: "Basic Usage", link: "/examples/basic" },
            { text: "Custom Styling", link: "/examples/styling" },
            { text: "Bar Connections", link: "/examples/connections" },
            { text: "Time Management", link: "/examples/time" },
            { text: "Advanced Features", link: "/examples/advanced" },
            { text: "Live Demo", link: "/examples/live" }

          ]
        }
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Xeyos88/HyVueGantt" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024"
    }
  }
})