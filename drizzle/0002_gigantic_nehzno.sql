ALTER TABLE "auth"."group_permission" DROP CONSTRAINT "group_permission_group_id_group_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."group_permission" DROP CONSTRAINT "group_permission_permission_id_permission_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."user_group" DROP CONSTRAINT "user_group_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."user_group" DROP CONSTRAINT "user_group_group_id_group_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."user_permission" DROP CONSTRAINT "user_permission_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."user_permission" DROP CONSTRAINT "user_permission_permission_id_permission_id_fk";
--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "email_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."group_permission" ADD CONSTRAINT "group_permission_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "auth"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."group_permission" ADD CONSTRAINT "group_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "auth"."permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_group" ADD CONSTRAINT "user_group_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_group" ADD CONSTRAINT "user_group_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "auth"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_permission" ADD CONSTRAINT "user_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_permission" ADD CONSTRAINT "user_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "auth"."permission"("id") ON DELETE cascade ON UPDATE no action;