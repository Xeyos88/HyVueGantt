import { defineConfig } from "vitepress"

export default defineConfig({
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
            { text: "Introduction", link: "/introduction" },
            { text: "Installation", link: "/installation" },
            { text: "Quick Start", link: "/quick-start" }
          ]
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Chart Configuration", link: "/chart-configuration" },
            { text: "Time Axis", link: "/time-axis" },
            { text: "Connections", link: "/connections" },
            { text: "Styling", link: "/styling" }
          ]
        },
        {
          text: "Components",
          items: [
            { text: "GGanttChart", link: "/g-gantt-chart" },
            { text: "GGanttRow", link: "/g-gantt-row" }
          ]
        },
        {
          text: "API Reference",
          items: [
            { text: "Props", link: "/props" },
            { text: "Events", link: "/events" },
            { text: "Types", link: "/types" },
            { text: "Color Schemes", link: "/color-schemes" }
          ]
        }
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Basic Usage", link: "/examples/basic" },
            { text: "Custom Styling", link: "/examples/styling" },
            { text: "Bar Connections", link: "/examples/connections" },
            { text: "Time Management", link: "/examples/time" },
            { text: "Advanced Features", link: "/examples/advanced" }
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
