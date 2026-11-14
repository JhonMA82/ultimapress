import type { Endpoint, PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * GDPR requests: find everything stored about one email address, download it, or delete it.
 *   GET    /api/up/personal-data?email=…   what is stored (JSON, also used for the download)
 *   DELETE /api/up/personal-data?email=…   delete comments and form entries for that address
 * Administrators only. User accounts are listed but never deleted here.
 */

const emailOf = (req: PayloadRequest) => {
  const raw = new URL(req.url || 'http://x').searchParams.get('email') || ''
  const email = raw.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 200 ? email : null
}

async function find(req: PayloadRequest, email: string) {
  const [comments, users] = await Promise.all([
    req.payload.find({
      collection: 'comments',
      where: { authorEmail: { equals: email } },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
      req,
    }),
    req.payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 5,
      depth: 0,
      overrideAccess: true,
      req,
    }),
  ])
  // Form entries keep answers as field/value pairs: match any answer equal to the address.
  const submissions = await req.payload.find({
    collection: 'form-submissions',
    where: { 'submissionData.value': { equals: email } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const caseInsensitive = submissions.docs.length
    ? submissions.docs
    : (
        await req.payload.find({
          collection: 'form-submissions',
          where: { 'submissionData.value': { like: email } },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
          req,
        })
      ).docs.filter((d) => (d.submissionData || []).some((s) => String(s.value).trim().toLowerCase() === email))
  return {
    comments: comments.docs.map((c) => ({
      id: c.id,
      name: c.authorName,
      email: c.authorEmail,
      comment: c.content,
      post: c.post,
      status: c.status,
      createdAt: c.createdAt,
    })),
    formEntries: caseInsensitive.map((s) => ({ id: s.id, form: s.form, answers: s.submissionData, createdAt: s.createdAt })),
    accounts: users.docs.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })),
  }
}

const deny = () => Response.json({ error: 'Administrators only' }, { status: 403 })
const bad = () => Response.json({ error: 'Enter a valid email address' }, { status: 400 })

export const personalDataEndpoints: Endpoint[] = [
  {
    path: '/up/personal-data',
    method: 'get',
    handler: async (req) => {
      if (!hasRole(req.user, 'admin')) return deny()
      const email = emailOf(req)
      if (!email) return bad()
      const data = await find(req, email)
      return Response.json({ email, exportedAt: new Date().toISOString(), site: req.payload.config.serverURL || null, ...data })
    },
  },
  {
    path: '/up/personal-data',
    method: 'delete',
    handler: async (req) => {
      if (!hasRole(req.user, 'admin')) return deny()
      const email = emailOf(req)
      if (!email) return bad()
      const data = await find(req, email)
      for (const c of data.comments) {
        await req.payload.delete({ collection: 'comments', id: c.id, overrideAccess: true, req })
      }
      for (const s of data.formEntries) {
        await req.payload.delete({ collection: 'form-submissions', id: s.id, overrideAccess: true, req })
      }
      req.payload.logger.info(`Personal data deleted for one address: ${data.comments.length} comments, ${data.formEntries.length} form entries`)
      return Response.json({ deleted: { comments: data.comments.length, formEntries: data.formEntries.length }, accounts: data.accounts.length })
    },
  },
]
