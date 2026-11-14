import type { Field } from 'payload'

/**
 * Extra SEO fields for pages and posts, shown in the SEO tab under the plugin's own
 * title, description and image: a focus keyword with a live check, social sharing
 * overrides, a canonical address and "hide from search engines".
 */
export const seoExtraFields = (): Field[] => [
  {
    name: 'focusKeyword',
    type: 'text',
    label: 'Focus keyword',
    admin: { description: 'The search phrase this page should rank for. The check below uses it.' },
  },
  {
    name: 'seoCheck',
    type: 'ui',
    admin: { components: { Field: '@/components/admin/SeoCheck#SeoCheck' } },
  },
  {
    type: 'collapsible',
    label: 'Social sharing',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'ogTitle',
        type: 'text',
        label: 'Title when shared',
        admin: { description: 'For Facebook, LinkedIn, X and WhatsApp. Leave empty to use the SEO title.' },
      },
      {
        name: 'ogDescription',
        type: 'textarea',
        label: 'Description when shared',
        admin: { description: 'Leave empty to use the meta description.' },
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Advanced',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'canonicalURL',
        type: 'text',
        label: 'Canonical address',
        validate: (value: string | null | undefined) =>
          !value || /^https?:\/\/[^\s]+$/i.test(value) || value.startsWith('/')
            ? true
            : 'Use a full address (https://…) or a path starting with /',
        admin: {
          description: 'Only if this content also lives at another address. Leave empty in most cases.',
        },
      },
      {
        name: 'noindex',
        type: 'checkbox',
        label: 'Hide from search engines',
        defaultValue: false,
        admin: { description: 'Search engines will not list this page, and it leaves the sitemap and llms.txt.' },
      },
    ],
  },
]
