import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Tags } from './collections/Tags'
import { Comments } from './collections/Comments'
import { SectionTemplates } from './collections/SectionTemplates'
import { SyncedSections } from './collections/SyncedSections'
import { PageViews } from './collections/PageViews'
import { NotFoundLog } from './collections/NotFoundLog'
import { visitorEndpoints } from './endpoints/visitors'
import { personalDataEndpoints } from './endpoints/personalData'
import { ActivityLog } from './collections/ActivityLog'
import { EmailLog } from './collections/EmailLog'
import { PrivateSettings } from './globals/PrivateSettings'
import { settingsEmailAdapter } from './email/adapter'
import { emailTestEndpoint } from './endpoints/emailTest'
import { backupEndpoints } from './endpoints/backups'
import { twoFactorEndpoints } from './security/twoFactor'
import { turnstileKeyEndpoint } from './security/turnstile'
import { activityLogPlugin } from './security/activityLog'
import { SiteSettings } from './globals/SiteSettings'
import { siteExportEndpoint, wordpressImportEndpoint } from './endpoints/wordpressImport'
import { claudeConnectEndpoint } from './endpoints/claudeConnect'
import { siteCodeEndpoints } from './endpoints/siteCode'
import { refreshAfterClaude, siteRefreshEndpoint } from './endpoints/siteRefresh'
import { migrations } from './migrations'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Admin wording: the account page's settings heading says "Preferences".
  i18n: { translations: { en: { general: { payloadSettings: 'Preferences' } } } },
  admin: {
    // Built-in avatar icon: no calls to Gravatar.
    avatar: 'default',
    meta: {
      titleSuffix: '- UltimaPress',
      description: 'The admin for your UltimaPress website.',
      openGraph: { siteName: 'UltimaPress', description: 'The admin for your UltimaPress website.' },
      icons: [
        { rel: 'icon', url: '/favicon.ico' },
        { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
      ],
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo',
        Icon: '@/components/admin/Icon',
      },
      beforeLogin: ['@/components/BeforeLogin'],
      // The Spine: UltimaPress's menu (src/components/admin/Spine)
      Nav: '@/components/admin/Spine#Spine',
      beforeDashboard: ['@/components/BeforeDashboard'],
      views: {
        // "Build a feature": its own page, linked from the Spine
        buildFeature: {
          Component: '@/components/admin/BuildFeature#BuildFeatureView',
          path: '/build-a-feature',
          // Without a title here the browser tab would say "Payload"
          meta: { title: 'Build a feature', openGraph: { title: 'Build a feature' } },
        },
        // "Site code": download the site's code, change it with Claude, put it live
        siteCode: {
          Component: '@/components/admin/SiteCode#SiteCodeView',
          path: '/site-code',
          meta: { title: 'Site code', openGraph: { title: 'Site code' } },
        },
        // Starter kits: a set of designed pages and a look, created in one go
        starterKits: {
          Component: '@/components/admin/StarterKits#StarterKitsView',
          path: '/starter-kits',
          meta: { title: 'Starter kits', openGraph: { title: 'Starter kits' } },
        },
        // GDPR: export or delete what is stored about one person
        personalData: {
          Component: '@/components/admin/PersonalData#PersonalDataView',
          path: '/personal-data',
          meta: { title: 'Personal data requests', openGraph: { title: 'Personal data requests' } },
        },
        // Backups: daily backups, download, restore
        backups: {
          Component: '@/components/admin/Backups#BackupsView',
          path: '/backups',
          meta: { title: 'Backups', openGraph: { title: 'Backups' } },
        },
        // Site health: what needs fixing, on one page
        siteHealth: {
          Component: '@/components/admin/SiteHealth#SiteHealthView',
          path: '/site-health',
          meta: { title: 'Site health', openGraph: { title: 'Site health' } },
        },
        // Built-in analytics: visitors, pages, sources, devices, countries
        analytics: {
          Component: '@/components/admin/Analytics#AnalyticsView',
          path: '/analytics',
          meta: { title: 'Analytics', openGraph: { title: 'Analytics' } },
        },
        // The visual builder: a page full screen, drag and drop (opened from a page)
        visualBuilder: {
          Component: '@/components/admin/VisualBuilder#VisualBuilderView',
          path: '/visual-builder',
          meta: { title: 'Visual builder', openGraph: { title: 'Visual builder' } },
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Database changes ship as migrations and run automatically when the site starts.
    prodMigrations: migrations,
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Tags,
    Comments,
    Users,
    SectionTemplates,
    SyncedSections,
    PageViews,
    NotFoundLog,
    ActivityLog,
    EmailLog,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [SiteSettings, Header, Footer, PrivateSettings],
  endpoints: [
    wordpressImportEndpoint,
    siteExportEndpoint,
    claudeConnectEndpoint,
    siteRefreshEndpoint,
    ...siteCodeEndpoints,
    ...visitorEndpoints,
    ...personalDataEndpoints,
    ...twoFactorEndpoints,
    ...backupEndpoints,
    emailTestEndpoint,
    turnstileKeyEndpoint,
  ],
  // Last, so it also covers collections that other plugins add.
  plugins: [...plugins, refreshAfterClaude, activityLogPlugin],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  // Email (password resets, form notifications). Set SMTP_* in .env to send real email;
  // without it, emails are written to the server log.
  // Email follows Settings > Email, backups and keys (then SMTP_* in .env, then the server log).
  email: settingsEmailAdapter(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    // Queued jobs (such as pages and posts scheduled to publish) are run every minute
    // from src/instrumentation.ts, through /api/payload-jobs/run.
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
