import { themes as prismThemes } from 'prism-react-renderer'

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'diagram.zip documentation',
  tagline: 'Create, style, save, and share text diagrams.',
  favicon: 'img/icon.svg',
  url: 'https://docs.diagram.zip',
  baseUrl: '/',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  organizationName: 'FelineStateMachine',
  projectName: 'diagramzip',
  staticDirectories: ['static'],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
          editUrl: 'https://github.com/FelineStateMachine/diagramzip/edit/main/diagramzip-docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      },
    ],
  ],
  themeConfig: {
    metadata: [
      { name: 'keywords', content: 'diagram.zip, diagrams, text diagrams, Mermaid, PlantUML' },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'diagram.zip docs',
      logo: {
        alt: 'diagram.zip',
        src: 'img/icon.svg',
      },
      items: [
        { to: '/create/', label: 'Create', position: 'left' },
        { to: '/style/presentation/', label: 'Style', position: 'left' },
        { to: '/collaboration/sharing/', label: 'Share', position: 'left' },
        { href: 'https://diagram.zip/', label: 'Open editor', position: 'right' },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Use diagram.zip',
          items: [
            { label: 'Create a diagram', to: '/create/' },
            { label: 'Style a diagram', to: '/style/presentation/' },
            { label: 'Share a diagram', to: '/collaboration/sharing/' },
          ],
        },
        {
          title: 'Machine-readable',
          items: [
            { label: 'llms.txt', href: 'https://docs.diagram.zip/llms.txt' },
            { label: 'Full reference', href: 'https://docs.diagram.zip/llms-full.txt' },
            { label: 'Diagram catalog', href: 'https://docs.diagram.zip/diagram-types.json' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'Source repository', href: 'https://github.com/FelineStateMachine/diagramzip' },
          ],
        },
      ],
      copyright: `diagram.zip documentation · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['clojure', 'json', 'latex', 'sql', 'yaml'],
    },
  },
}

export default config
