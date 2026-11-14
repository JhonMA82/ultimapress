import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "section_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"html" varchar NOT NULL,
  	"css" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "section_templates_id" integer;
  CREATE INDEX "section_templates_updated_at_idx" ON "section_templates" USING btree ("updated_at");
  CREATE INDEX "section_templates_created_at_idx" ON "section_templates" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_section_templates_fk" FOREIGN KEY ("section_templates_id") REFERENCES "public"."section_templates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_section_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("section_templates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "section_templates" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "section_templates" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_section_templates_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_section_templates_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "section_templates_id";`)
}
