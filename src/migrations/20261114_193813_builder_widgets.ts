import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_loop_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"collection" varchar DEFAULT 'posts',
  	"limit" numeric DEFAULT 6,
  	"show_filter" boolean DEFAULT false,
  	"load_more" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_loop_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"collection" varchar DEFAULT 'posts',
  	"limit" numeric DEFAULT 6,
  	"show_filter" boolean DEFAULT false,
  	"load_more" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "synced_sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"html" varchar NOT NULL,
  	"css" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_design" ADD COLUMN "synced_id" integer;
  ALTER TABLE "_pages_v_blocks_design" ADD COLUMN "synced_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "synced_sections_id" integer;
  ALTER TABLE "header" ADD COLUMN "designed" boolean DEFAULT false;
  ALTER TABLE "header" ADD COLUMN "design_html" varchar;
  ALTER TABLE "header" ADD COLUMN "design_css" varchar;
  ALTER TABLE "footer" ADD COLUMN "designed" boolean DEFAULT false;
  ALTER TABLE "footer" ADD COLUMN "design_html" varchar;
  ALTER TABLE "footer" ADD COLUMN "design_css" varchar;
  ALTER TABLE "pages_blocks_loop_grid" ADD CONSTRAINT "pages_blocks_loop_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_loop_grid" ADD CONSTRAINT "_pages_v_blocks_loop_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_loop_grid_order_idx" ON "pages_blocks_loop_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_loop_grid_parent_id_idx" ON "pages_blocks_loop_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_loop_grid_path_idx" ON "pages_blocks_loop_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_loop_grid_order_idx" ON "_pages_v_blocks_loop_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_loop_grid_parent_id_idx" ON "_pages_v_blocks_loop_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_loop_grid_path_idx" ON "_pages_v_blocks_loop_grid" USING btree ("_path");
  CREATE INDEX "synced_sections_updated_at_idx" ON "synced_sections" USING btree ("updated_at");
  CREATE INDEX "synced_sections_created_at_idx" ON "synced_sections" USING btree ("created_at");
  ALTER TABLE "pages_blocks_design" ADD CONSTRAINT "pages_blocks_design_synced_id_synced_sections_id_fk" FOREIGN KEY ("synced_id") REFERENCES "public"."synced_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_design" ADD CONSTRAINT "_pages_v_blocks_design_synced_id_synced_sections_id_fk" FOREIGN KEY ("synced_id") REFERENCES "public"."synced_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_synced_sections_fk" FOREIGN KEY ("synced_sections_id") REFERENCES "public"."synced_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_design_synced_idx" ON "pages_blocks_design" USING btree ("synced_id");
  CREATE INDEX "_pages_v_blocks_design_synced_idx" ON "_pages_v_blocks_design" USING btree ("synced_id");
  CREATE INDEX "payload_locked_documents_rels_synced_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("synced_sections_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_loop_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_loop_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "synced_sections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_loop_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_loop_grid" CASCADE;
  DROP TABLE "synced_sections" CASCADE;
  ALTER TABLE "pages_blocks_design" DROP CONSTRAINT "pages_blocks_design_synced_id_synced_sections_id_fk";
  
  ALTER TABLE "_pages_v_blocks_design" DROP CONSTRAINT "_pages_v_blocks_design_synced_id_synced_sections_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_synced_sections_fk";
  
  DROP INDEX "pages_blocks_design_synced_idx";
  DROP INDEX "_pages_v_blocks_design_synced_idx";
  DROP INDEX "payload_locked_documents_rels_synced_sections_id_idx";
  ALTER TABLE "pages_blocks_design" DROP COLUMN "synced_id";
  ALTER TABLE "_pages_v_blocks_design" DROP COLUMN "synced_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "synced_sections_id";
  ALTER TABLE "header" DROP COLUMN "designed";
  ALTER TABLE "header" DROP COLUMN "design_html";
  ALTER TABLE "header" DROP COLUMN "design_css";
  ALTER TABLE "footer" DROP COLUMN "designed";
  ALTER TABLE "footer" DROP COLUMN "design_html";
  ALTER TABLE "footer" DROP COLUMN "design_css";`)
}
