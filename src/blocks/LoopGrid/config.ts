import type { Block } from 'payload'

/**
 * A grid of the newest items from any collection: posts, property listings, events,
 * or anything built later. Optional category filter and a Load more button.
 */
export const LoopGrid: Block = {
  slug: 'loopGrid',
  interfaceName: 'LoopGridBlock',
  labels: { singular: 'Content grid', plural: 'Content grids' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'collection',
      type: 'text',
      required: true,
      defaultValue: 'posts',
      admin: { description: 'Which content to show, for example posts or properties.' },
    },
    { name: 'limit', type: 'number', defaultValue: 6, min: 1, max: 48 },
    {
      name: 'showFilter',
      label: 'Show category filter',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Only for content with categories, such as posts.' },
    },
    { name: 'loadMore', label: 'Show a Load more button', type: 'checkbox', defaultValue: true },
  ],
}
