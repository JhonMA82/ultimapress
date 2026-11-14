import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_activity_log_action" AS ENUM('created', 'updated', 'deleted', 'published', 'logged in', 'security');
  CREATE TYPE "public"."enum_email_log_status" AS ENUM('sent', 'failed', 'logged');
  CREATE TYPE "public"."enum_site_settings_code_snippets_location" AS ENUM('head', 'bodyStart', 'bodyEnd');
  CREATE TYPE "public"."enum_site_settings_business_type" AS ENUM('Organization', 'LocalBusiness', 'ProfessionalService', 'Store', 'Restaurant', 'RealEstateAgent', 'HealthAndBeautyBusiness', 'HomeAndConstructionBusiness', 'LodgingBusiness', 'Person');
  CREATE TYPE "public"."enum_site_settings_cookie_banner" AS ENUM('auto', 'always', 'never');
  CREATE TYPE "public"."enum_site_settings_announcement_style" AS ENUM('brand', 'dark', 'light');
  CREATE TYPE "public"."enum_private_settings_smtp_security" AS ENUM('auto', 'ssl', 'starttls');
  CREATE TABLE "page_views" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"referrer" varchar,
  	"device" varchar,
  	"browser" varchar,
  	"country" varchar,
  	"visitor" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "not_found_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"hits" numeric DEFAULT 1,
  	"last_seen" timestamp(3) with time zone,
  	"last_referrer" varchar,
  	"redirected" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "activity_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"who" varchar,
  	"user_id" integer,
  	"action" "enum_activity_log_action",
  	"area" varchar,
  	"doc_id" varchar,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "email_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar,
  	"to" varchar,
  	"status" "enum_email_log_status",
  	"error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_code_snippets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"location" "enum_site_settings_code_snippets_location" DEFAULT 'head' NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"code" varchar NOT NULL,
  	"needs_consent" boolean DEFAULT false
  );
  
  CREATE TABLE "private_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"smtp_host" varchar,
  	"smtp_port" numeric DEFAULT 465,
  	"smtp_security" "enum_private_settings_smtp_security" DEFAULT 'auto',
  	"smtp_user" varchar,
  	"smtp_pass" varchar,
  	"from_address" varchar,
  	"from_name" varchar,
  	"turnstile_site_key" varchar,
  	"turnstile_secret" varchar,
  	"backups_enabled" boolean DEFAULT true,
  	"backup_hour" numeric DEFAULT 3,
  	"backup_keep_days" numeric DEFAULT 30,
  	"backup_media" boolean DEFAULT true,
  	"offsite_enabled" boolean DEFAULT false,
  	"s3_endpoint" varchar,
  	"s3_region" varchar DEFAULT 'auto',
  	"s3_bucket" varchar,
  	"s3_access_key" varchar,
  	"s3_secret_key" varchar,
  	"s3_prefix" varchar DEFAULT 'ultimapress-backups',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages" ADD COLUMN "meta_focus_keyword" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_og_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_og_description" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_canonical_u_r_l" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_noindex" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_focus_keyword" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_og_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_og_description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_canonical_u_r_l" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_noindex" boolean DEFAULT false;
  ALTER TABLE "posts" ADD COLUMN "meta_focus_keyword" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_og_title" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_og_description" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_canonical_u_r_l" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_noindex" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_focus_keyword" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_og_title" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_og_description" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_canonical_u_r_l" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_noindex" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "two_factor_secret" varchar;
  ALTER TABLE "users" ADD COLUMN "two_factor_pending" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "page_views_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "not_found_log_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "activity_log_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_log_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "business_type" "enum_site_settings_business_type" DEFAULT 'Organization';
  ALTER TABLE "site_settings" ADD COLUMN "business_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "price_range" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "default_share_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "enable_llms_txt" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "google_verification" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "bing_verification" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "enable_analytics" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "analytics_retention_days" numeric DEFAULT 395;
  ALTER TABLE "site_settings" ADD COLUMN "ga4_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "gtm_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "meta_pixel_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "plausible_domain" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "cookie_banner" "enum_site_settings_cookie_banner" DEFAULT 'auto';
  ALTER TABLE "site_settings" ADD COLUMN "cookie_banner_text" varchar DEFAULT 'We use cookies to understand how our site is used and to improve it. You can accept or decline; the site works either way.';
  ALTER TABLE "site_settings" ADD COLUMN "announcement_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_text" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_link_label" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_link_u_r_l" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_start" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_end" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_style" "enum_site_settings_announcement_style" DEFAULT 'brand';
  ALTER TABLE "site_settings" ADD COLUMN "announcement_dismissible" boolean DEFAULT true;
  ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_code_snippets" ADD CONSTRAINT "site_settings_code_snippets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_views_day_idx" ON "page_views" USING btree ("day");
  CREATE INDEX "page_views_path_idx" ON "page_views" USING btree ("path");
  CREATE INDEX "page_views_referrer_idx" ON "page_views" USING btree ("referrer");
  CREATE INDEX "page_views_visitor_idx" ON "page_views" USING btree ("visitor");
  CREATE INDEX "page_views_updated_at_idx" ON "page_views" USING btree ("updated_at");
  CREATE INDEX "page_views_created_at_idx" ON "page_views" USING btree ("created_at");
  CREATE UNIQUE INDEX "not_found_log_path_idx" ON "not_found_log" USING btree ("path");
  CREATE INDEX "not_found_log_updated_at_idx" ON "not_found_log" USING btree ("updated_at");
  CREATE INDEX "not_found_log_created_at_idx" ON "not_found_log" USING btree ("created_at");
  CREATE INDEX "activity_log_user_idx" ON "activity_log" USING btree ("user_id");
  CREATE INDEX "activity_log_updated_at_idx" ON "activity_log" USING btree ("updated_at");
  CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");
  CREATE INDEX "email_log_updated_at_idx" ON "email_log" USING btree ("updated_at");
  CREATE INDEX "email_log_created_at_idx" ON "email_log" USING btree ("created_at");
  CREATE INDEX "site_settings_code_snippets_order_idx" ON "site_settings_code_snippets" USING btree ("_order");
  CREATE INDEX "site_settings_code_snippets_parent_id_idx" ON "site_settings_code_snippets" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_views_fk" FOREIGN KEY ("page_views_id") REFERENCES "public"."page_views"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_not_found_log_fk" FOREIGN KEY ("not_found_log_id") REFERENCES "public"."not_found_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_log_fk" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_log_fk" FOREIGN KEY ("email_log_id") REFERENCES "public"."email_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_share_image_id_media_id_fk" FOREIGN KEY ("default_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_page_views_id_idx" ON "payload_locked_documents_rels" USING btree ("page_views_id");
  CREATE INDEX "payload_locked_documents_rels_not_found_log_id_idx" ON "payload_locked_documents_rels" USING btree ("not_found_log_id");
  CREATE INDEX "payload_locked_documents_rels_activity_log_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_log_id");
  CREATE INDEX "payload_locked_documents_rels_email_log_id_idx" ON "payload_locked_documents_rels" USING btree ("email_log_id");
  CREATE INDEX "site_settings_default_share_image_idx" ON "site_settings" USING btree ("default_share_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_views" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "not_found_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "activity_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "email_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_code_snippets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "private_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "page_views" CASCADE;
  DROP TABLE "not_found_log" CASCADE;
  DROP TABLE "activity_log" CASCADE;
  DROP TABLE "email_log" CASCADE;
  DROP TABLE "site_settings_code_snippets" CASCADE;
  DROP TABLE "private_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_page_views_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_not_found_log_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_activity_log_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_email_log_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_default_share_image_id_media_id_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_page_views_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_not_found_log_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_activity_log_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_email_log_id_idx";
  DROP INDEX IF EXISTS "site_settings_default_share_image_idx";
  ALTER TABLE "pages" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "pages" DROP COLUMN "meta_og_title";
  ALTER TABLE "pages" DROP COLUMN "meta_og_description";
  ALTER TABLE "pages" DROP COLUMN "meta_canonical_u_r_l";
  ALTER TABLE "pages" DROP COLUMN "meta_noindex";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_focus_keyword";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_og_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_og_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_canonical_u_r_l";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_noindex";
  ALTER TABLE "posts" DROP COLUMN "meta_focus_keyword";
  ALTER TABLE "posts" DROP COLUMN "meta_og_title";
  ALTER TABLE "posts" DROP COLUMN "meta_og_description";
  ALTER TABLE "posts" DROP COLUMN "meta_canonical_u_r_l";
  ALTER TABLE "posts" DROP COLUMN "meta_noindex";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_focus_keyword";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_og_title";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_og_description";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_canonical_u_r_l";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_noindex";
  ALTER TABLE "users" DROP COLUMN "two_factor_enabled";
  ALTER TABLE "users" DROP COLUMN "two_factor_secret";
  ALTER TABLE "users" DROP COLUMN "two_factor_pending";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "page_views_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "not_found_log_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "activity_log_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "email_log_id";
  ALTER TABLE "site_settings" DROP COLUMN "business_type";
  ALTER TABLE "site_settings" DROP COLUMN "business_name";
  ALTER TABLE "site_settings" DROP COLUMN "price_range";
  ALTER TABLE "site_settings" DROP COLUMN "default_share_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "enable_llms_txt";
  ALTER TABLE "site_settings" DROP COLUMN "google_verification";
  ALTER TABLE "site_settings" DROP COLUMN "bing_verification";
  ALTER TABLE "site_settings" DROP COLUMN "enable_analytics";
  ALTER TABLE "site_settings" DROP COLUMN "analytics_retention_days";
  ALTER TABLE "site_settings" DROP COLUMN "ga4_id";
  ALTER TABLE "site_settings" DROP COLUMN "gtm_id";
  ALTER TABLE "site_settings" DROP COLUMN "meta_pixel_id";
  ALTER TABLE "site_settings" DROP COLUMN "plausible_domain";
  ALTER TABLE "site_settings" DROP COLUMN "cookie_banner";
  ALTER TABLE "site_settings" DROP COLUMN "cookie_banner_text";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_text";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_link_label";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_link_u_r_l";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_start";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_end";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_style";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_dismissible";
  DROP TYPE "public"."enum_activity_log_action";
  DROP TYPE "public"."enum_email_log_status";
  DROP TYPE "public"."enum_site_settings_code_snippets_location";
  DROP TYPE "public"."enum_site_settings_business_type";
  DROP TYPE "public"."enum_site_settings_cookie_banner";
  DROP TYPE "public"."enum_site_settings_announcement_style";
  DROP TYPE "public"."enum_private_settings_smtp_security";`)
}
