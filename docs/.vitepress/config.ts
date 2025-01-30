import { defineConfig } from "vitepress"

export default defineConfig({

  lang: 'en-US',
  title: "Hyper Vue Gantt",
  description: "Documentation for the Huper Vue Gantt Chart Library",
  base: '/HyVueGantt/',
  head: [['link', { rel: 'icon', href: 'https://raw.githubusercontent.com/Xeyos88/HyVueGantt/refs/heads/main/public/favicon.ico' }]],

  themeConfig: {
    logo: {
      src: 'https://github.com/Xeyos88/HyVueGantt/blob/main/docs/.vitepress/public/logo.png?raw=true',
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
          ]
        },
        {
          text: "Live Demo",
          items: [
            { text: "Base", link: "/live/base" },
            { text: "Connections", link: "/live/connection" },
            { text: "Multi Columns", link: "/live/multicolumn" },
            { text: "Bar Slot", link: "/live/barslot" },
            { text: "Commands Slot", link: "/live/commands" },
            { text: "Holiday", link: "/live/holiday" },
            { text: "Other", link: "/live/others" },
            { text: "Grouping", link: "/live/grouping" },
            { text: "Events", link: "/live/events" }
            
          ]
        }
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Xeyos88/HyVueGantt" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025"
    }
  }
})
