import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

import { isAdmin, isAdminFieldLevel } from '../access/roles'

export const FONT_OPTIONS = [
  'Inter',
  'Manrope',
  'DM Sans',
  'Plus Jakarta Sans',
  'Outfit',
  'Space Grotesk',
  'Playfair Display',
  'Cormorant Garamond',
  'Fraunces',
  'Lora',
  'Merriweather',
  'Archivo',
] as const

export const TEMPLATE_OPTIONS = [
  { label: 'Luxury editorial', value: 'editorial' },
  { label: 'Modern bright', value: 'bright' },
  { label: 'Dark premium', value: 'dark' },
  { label: 'Swiss bold', value: 'swiss' },
]

/**
 * Site Settings: the UltimaPress equivalent of WordPress's General, Reading,
 * Discussion and Customizer screens, in one place.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'siteTitle', type: 'text', defaultValue: 'My UltimaPress Site', required: true },
            { name: 'tagline', type: 'text', defaultValue: 'Just another UltimaPress site' },
            {
              type: 'row',
              fields: [
                { name: 'logo', type: 'upload', relationTo: 'media' },
                {
                  name: 'siteIcon',
                  label: 'Site icon (favicon)',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Square image, 512 x 512 px recommended.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'language', type: 'text', defaultValue: 'en', admin: { width: '33%' } },
                {
                  name: 'timezone',
                  type: 'text',
                  defaultValue: 'UTC',
                  admin: { width: '33%', description: 'e.g. Europe/Dublin' },
                },
                {
                  name: 'dateFormat',
                  type: 'select',
                  defaultValue: 'long',
                  admin: { width: '33%' },
                  options: [
                    { label: 'November 11, 2026', value: 'long' },
                    { label: '11/11/2026', value: 'numeric' },
                    { label: '2026-11-11', value: 'iso' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Design',
          fields: [
            {
              name: 'template',
              type: 'select',
              defaultValue: 'bright',
              required: true,
              options: TEMPLATE_OPTIONS,
              admin: { description: 'Switch the look of the whole site in one click.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'primaryColor',
                  type: 'text',
                  defaultValue: '#7B2BFF',
                  admin: { width: '50%', description: 'Buttons and links, as a hex colour.' },
                },
                {
                  name: 'accentColor',
                  type: 'text',
                  defaultValue: '#F21CD9',
                  admin: { width: '50%', description: 'Highlights, as a hex colour.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'headingFont',
                  type: 'select',
                  defaultValue: 'Manrope',
                  options: FONT_OPTIONS.map((f) => ({ label: f, value: f })),
                  admin: { width: '50%' },
                },
                {
                  name: 'bodyFont',
                  type: 'select',
                  defaultValue: 'Inter',
                  options: FONT_OPTIONS.map((f) => ({ label: f, value: f })),
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'customCSS',
              label: 'Additional CSS',
              type: 'code',
              admin: { language: 'css' },
            },
          ],
        },
        {
          label: 'Reading',
          fields: [
            {
              name: 'homepageDisplays',
              label: 'Your homepage displays',
              type: 'radio',
              defaultValue: 'page',
              options: [
                { label: 'A static page', value: 'page' },
                { label: 'Your latest posts', value: 'posts' },
              ],
            },
            {
              name: 'homepage',
              type: 'relationship',
              relationTo: 'pages',
              admin: {
                condition: (_, siblingData) => siblingData?.homepageDisplays === 'page',
                description: 'Leave empty to use the page with the slug "home".',
              },
            },
            { name: 'postsPerPage', type: 'number', defaultValue: 12, min: 1, max: 100 },
            {
              name: 'discourageSearchEngines',
              label: 'Discourage search engines from indexing this site',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
        {
          label: 'Features',
          description:
            'Turn features on and off. Everything here is built in, no plugins to install or update.',
          fields: [
            { name: 'enableBlog', label: 'Blog', type: 'checkbox', defaultValue: true },
            { name: 'enableComments', label: 'Comments', type: 'checkbox', defaultValue: true },
            {
              name: 'moderateComments',
              label: 'Hold new comments for approval',
              type: 'checkbox',
              defaultValue: true,
              admin: { condition: (_, s) => Boolean(s?.enableComments) },
            },
            { name: 'enableSearch', label: 'Site search', type: 'checkbox', defaultValue: true },
            { name: 'enableRSS', label: 'RSS feed', type: 'checkbox', defaultValue: true },
            {
              name: 'enableThemeSwitcher',
              label: 'Light / dark switcher in the footer',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
        {
          label: 'Maintenance',
          fields: [
            {
              name: 'maintenanceMode',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Visitors see a holding page. Logged-in users see the site.' },
            },
            {
              name: 'maintenanceMessage',
              type: 'textarea',
              defaultValue: 'We are making some improvements. Back very soon.',
            },
          ],
        },
        {
          label: 'SEO',
          description: 'How search engines and AI assistants see the site. Every page also has its own SEO tab.',
          fields: [
            {
              name: 'businessType',
              type: 'select',
              defaultValue: 'Organization',
              admin: {
                description:
                  'Used in the structured data (schema) on every page, together with the details in your footer: phone, email, address, hours and social links.',
              },
              options: [
                { label: 'Organisation or brand', value: 'Organization' },
                { label: 'Local business', value: 'LocalBusiness' },
                { label: 'Professional service', value: 'ProfessionalService' },
                { label: 'Shop', value: 'Store' },
                { label: 'Restaurant or café', value: 'Restaurant' },
                { label: 'Real estate agent', value: 'RealEstateAgent' },
                { label: 'Health or beauty', value: 'HealthAndBeautyBusiness' },
                { label: 'Home services (trades)', value: 'HomeAndConstructionBusiness' },
                { label: 'Lodging (hotel, B&B)', value: 'LodgingBusiness' },
                { label: 'Person (personal site)', value: 'Person' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'businessName',
                  type: 'text',
                  admin: { width: '50%', description: 'Leave empty to use the site title.' },
                },
                {
                  name: 'priceRange',
                  type: 'text',
                  admin: { width: '50%', description: 'Optional, for local businesses, e.g. €€ or €50-€500.' },
                },
              ],
            },
            {
              name: 'defaultShareImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Shown when a page without its own image is shared on social media.' },
            },
            {
              name: 'enableLlmsTxt',
              label: 'Publish llms.txt for AI assistants',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'A plain summary of your pages and posts at /llms.txt that ChatGPT, Claude, Perplexity and other AI tools can read.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'googleVerification',
                  label: 'Google Search Console code',
                  type: 'text',
                  admin: { width: '50%', description: 'Only the code from the HTML tag, e.g. abc123…' },
                },
                {
                  name: 'bingVerification',
                  label: 'Bing Webmaster code',
                  type: 'text',
                  admin: { width: '50%', description: 'Only the code from the HTML tag.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Analytics',
          description:
            'Visitor stats are built in: no cookies, no personal data, nothing sent to anyone else. See them under Grow > Analytics.',
          fields: [
            {
              name: 'enableAnalytics',
              label: 'Count visitors (built-in, no cookies)',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'analyticsRetentionDays',
              label: 'Keep visitor stats for (days)',
              type: 'number',
              defaultValue: 395,
              min: 30,
              max: 1100,
            },
            {
              type: 'collapsible',
              label: 'Other analytics tools (optional)',
              admin: {
                description:
                  'Google Analytics, Tag Manager and the Meta Pixel use cookies, so a cookie banner appears and they only load after a visitor accepts.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'ga4Id',
                      label: 'Google Analytics 4 ID',
                      type: 'text',
                      validate: (v: string | null | undefined) =>
                        !v || /^G-[A-Z0-9]{4,20}$/i.test(v.trim()) ? true : 'Looks like G-XXXXXXX',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'gtmId',
                      label: 'Google Tag Manager ID',
                      type: 'text',
                      validate: (v: string | null | undefined) =>
                        !v || /^GTM-[A-Z0-9]{4,12}$/i.test(v.trim()) ? true : 'Looks like GTM-XXXXXX',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'metaPixelId',
                      label: 'Meta (Facebook) Pixel ID',
                      type: 'text',
                      validate: (v: string | null | undefined) =>
                        !v || /^\d{6,20}$/.test(v.trim()) ? true : 'Numbers only',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'plausibleDomain',
                      label: 'Plausible domain',
                      type: 'text',
                      validate: (v: string | null | undefined) =>
                        !v || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v.trim()) ? true : 'Just the domain, e.g. example.com',
                      admin: { width: '50%', description: 'No cookies, so no banner needed.' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Privacy',
          fields: [
            {
              name: 'privacyPolicyPage',
              type: 'relationship',
              relationTo: 'pages',
              admin: { description: 'Linked in the footer, on comment forms and in the cookie banner.' },
            },
            {
              name: 'cookieBanner',
              type: 'select',
              defaultValue: 'auto',
              options: [
                { label: 'Automatic: only when a tool that uses cookies is switched on', value: 'auto' },
                { label: 'Always show', value: 'always' },
                { label: 'Never show', value: 'never' },
              ],
              admin: {
                description:
                  'Under GDPR, tools that set cookies (Google Analytics, Tag Manager, Meta Pixel, some code snippets) need consent first.',
              },
            },
            {
              name: 'cookieBannerText',
              type: 'textarea',
              defaultValue:
                'We use cookies to understand how our site is used and to improve it. You can accept or decline; the site works either way.',
            },
          ],
        },
        {
          label: 'Code',
          description:
            'Add code from other services (chat widgets, booking tools, verification tags) without editing the site. Administrators only.',
          fields: [
            {
              name: 'codeSnippets',
              type: 'array',
              labels: { singular: 'Snippet', plural: 'Snippets' },
              access: { create: isAdminFieldLevel, update: isAdminFieldLevel },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true, admin: { width: '40%' } },
                    {
                      name: 'location',
                      type: 'select',
                      defaultValue: 'head',
                      required: true,
                      options: [
                        { label: 'In the <head>', value: 'head' },
                        { label: 'Start of the page body', value: 'bodyStart' },
                        { label: 'End of the page body', value: 'bodyEnd' },
                      ],
                      admin: { width: '30%' },
                    },
                    {
                      name: 'enabled',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: { width: '15%', style: { alignSelf: 'flex-end' } },
                    },
                  ],
                },
                {
                  name: 'code',
                  type: 'code',
                  required: true,
                  admin: { language: 'html' },
                },
                {
                  name: 'needsConsent',
                  label: 'Only load after the visitor accepts cookies',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { description: 'Tick this for anything that tracks visitors, like ad pixels.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Announcement',
          description: 'A bar across the top of every page, for offers, news or closures.',
          fields: [
            { name: 'announcementEnabled', label: 'Show the announcement bar', type: 'checkbox', defaultValue: false },
            { name: 'announcementText', type: 'text', label: 'Message' },
            {
              type: 'row',
              fields: [
                { name: 'announcementLinkLabel', type: 'text', label: 'Link text', admin: { width: '40%' } },
                { name: 'announcementLinkURL', type: 'text', label: 'Link address', admin: { width: '60%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'announcementStart',
                  type: 'date',
                  label: 'Show from',
                  admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' }, description: 'Optional' },
                },
                {
                  name: 'announcementEnd',
                  type: 'date',
                  label: 'Hide after',
                  admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' }, description: 'Optional' },
                },
              ],
            },
            {
              name: 'announcementStyle',
              type: 'select',
              defaultValue: 'brand',
              options: [
                { label: 'Brand colour', value: 'brand' },
                { label: 'Dark', value: 'dark' },
                { label: 'Light', value: 'light' },
              ],
            },
            { name: 'announcementDismissible', label: 'Visitors can close it', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req: { payload, context } }) => {
        if (!context.disableRevalidate) {
          payload.logger.info('Revalidating site settings')
          revalidateTag('global_site-settings', 'max')
        }
        return doc
      },
    ],
  },
}
