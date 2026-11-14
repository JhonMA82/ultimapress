import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_menu_style" AS ENUM('spine', 'sidebar');
  ALTER TABLE "users" ADD COLUMN "menu_style" "enum_users_menu_style" DEFAULT 'spine';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "menu_style";
  DROP TYPE "public"."enum_users_menu_style";`)
}
