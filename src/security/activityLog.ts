import type { CollectionConfig, Config, GlobalConfig, PayloadRequest, Plugin } from 'payload'

/**
 * The activity log: adds hooks to every collection and global so each change is
 * recorded (who, what, when), plus logins. Repeated saves of the same thing by the same
 * person within 10 minutes (autosave) update one entry instead of adding many.
 */

const SKIP = new Set([
  'activity-log',
  'page-views',
  'not-found-log',
  'email-log',
  'search',
  'payload-preferences',
  'payload-migrations',
  'payload-locked-documents',
  'payload-jobs',
  'payload-folders',
  'form-submissions',
  'comments',
])

const nameOf = (u: unknown) => {
  const user = u as { name?: string; email?: string } | null
  return user?.name || user?.email || 'Someone'
}

const titleOf = (doc: Record<string, unknown> | undefined, fallback: string) =>
  String((doc && (doc.title || doc.name || doc.email || doc.filename || doc.slug)) || fallback).slice(0, 120)

type Action = 'created' | 'updated' | 'deleted' | 'published' | 'logged in' | 'security'

let lastPurge = 0

async function record(
  req: PayloadRequest,
  entry: { summary: string; action: Action; area: string; docId?: string; ip?: string },
) {
  const user = req.user && (req.user as { collection?: string }).collection === 'users' ? req.user : null
  try {
    const since = new Date(Date.now() - 10 * 60_000).toISOString()
    if (user && entry.docId && entry.action === 'updated') {
      const recent = await req.payload.find({
        collection: 'activity-log',
        where: {
          and: [
            { user: { equals: user.id } },
            { docId: { equals: entry.docId } },
            { area: { equals: entry.area } },
            { action: { equals: 'updated' } },
            { createdAt: { greater_than: since } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      })
      if (recent.docs[0]) {
        await req.payload.update({
          collection: 'activity-log',
          id: recent.docs[0].id,
          data: { summary: entry.summary },
          overrideAccess: true,
          depth: 0,
          req,
          context: { activityLog: false },
        })
        return
      }
    }
    await req.payload.create({
      collection: 'activity-log',
      data: { ...entry, who: user ? nameOf(user) : entry.action.startsWith('login') ? 'Visitor' : 'System', user: user?.id as number | undefined },
      overrideAccess: true,
      depth: 0,
      req,
      context: { activityLog: false },
    })
    if (Date.now() - lastPurge > 3_600_000) {
      lastPurge = Date.now()
      await req.payload.db.deleteMany({
        collection: 'activity-log',
        where: { createdAt: { less_than: new Date(Date.now() - 180 * 86_400_000).toISOString() } },
        req,
      })
    }
  } catch (err) {
    req.payload.logger.warn({ msg: 'Activity log entry skipped', err })
  }
}

/** A readable name: the configured label, else the slug made singular ("pages" → "page"). */
const label = (c: CollectionConfig | GlobalConfig, collection = false) => {
  const l = ('labels' in c && c.labels?.singular) || ('label' in c && c.label)
  if (typeof l === 'string') return l
  const words = c.slug.replace(/-/g, ' ')
  return collection ? words.replace(/ies$/, 'y').replace(/s$/, '') : words
}

const ipOf = (req: PayloadRequest) =>
  req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || ''

export const activityLogPlugin: Plugin = (config: Config): Config => {
  const collections = (config.collections || []).map((c) => {
    if (SKIP.has(c.slug)) return c
    const area = label(c, true)
    const hooks = { ...(c.hooks || {}) }
    hooks.afterChange = [
      ...(hooks.afterChange || []),
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context?.activityLog === false || !req.user) return doc
        const title = titleOf(doc, String(doc.id))
        const published = doc._status === 'published' && previousDoc?._status !== 'published'
        const action: Action = context?.activityAction
          ? 'security'
          : operation === 'create'
            ? 'created'
            : published
              ? 'published'
              : 'updated'
        const summary = context?.activityAction
          ? `${nameOf(req.user)} ${context.activityAction}`
          : `${action[0].toUpperCase()}${action.slice(1)} ${area.toLowerCase()} "${title}"`
        await record(req, { summary, action, area, docId: String(doc.id) })
        return doc
      },
    ]
    hooks.afterDelete = [
      ...(hooks.afterDelete || []),
      async ({ doc, req, context }) => {
        if (context?.activityLog === false || !req.user) return doc
        await record(req, { summary: `Deleted ${area.toLowerCase()} "${titleOf(doc, String(doc.id))}"`, action: 'deleted', area, docId: String(doc.id) })
        return doc
      },
    ]
    if (c.auth) {
      hooks.afterLogin = [
        ...(hooks.afterLogin || []),
        async ({ req, user }) => {
          req.user = { ...user, collection: c.slug }
          await record(req, { summary: `${nameOf(user)} logged in`, action: 'logged in', area: 'Login', ip: ipOf(req) })
        },
      ]
    }
    return { ...c, hooks }
  })

  const globals = (config.globals || []).map((g) => {
    const area = label(g)
    return {
      ...g,
      hooks: {
        ...(g.hooks || {}),
        afterChange: [
          ...(g.hooks?.afterChange || []),
          async ({ doc, req, context }: { doc: Record<string, unknown>; req: PayloadRequest; context: Record<string, unknown> }) => {
            if (context?.activityLog === false || !req.user) return doc
            await record(req, { summary: `Changed ${area}`, action: 'updated', area, docId: g.slug })
            return doc
          },
        ],
      },
    }
  })

  return { ...config, collections, globals }
}
