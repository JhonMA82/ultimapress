import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { isAdminOrEditor, isAnyRole } from '../access/roles'

const WEBP = { format: 'webp' as const, options: { quality: 80 } }

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  admin: {
    group: 'Media',
  },
  access: {
    create: isAnyRole,
    delete: isAdminOrEditor,
    read: anyone,
    update: isAnyRole,
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt text',
      type: 'text',
      admin: { description: 'Describe the image for blind visitors and for Google. Site health lists images without it.' },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    // In Docker this points at a persistent volume (MEDIA_DIR=/app/media).
    staticDir: process.env.MEDIA_DIR || path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    // Very large uploads are shrunk to 2560 px on the long side (photos straight from a
    // phone or camera), and every smaller copy is saved as WebP, which loads much faster.
    resizeOptions: { width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true },
    imageSizes: [
      { name: 'thumbnail', width: 300, formatOptions: WEBP },
      { name: 'square', width: 500, height: 500, formatOptions: WEBP },
      { name: 'small', width: 600, formatOptions: WEBP },
      { name: 'medium', width: 900, formatOptions: WEBP },
      { name: 'large', width: 1400, formatOptions: WEBP },
      { name: 'xlarge', width: 1920, formatOptions: WEBP },
      // Social sharing image: JPEG, which every network accepts.
      { name: 'og', width: 1200, height: 630, crop: 'center', formatOptions: { format: 'jpeg', options: { quality: 82 } } },
    ],
  },
}
