import { pgSchema, text, timestamp, uuid, varchar, boolean } from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const usersTable = authSchema.table("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  active: boolean("active").notNull().default(true),
  emailConfirmed: boolean("email_confirmed").notNull().default(false),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
  invitedById: uuid("invited_by_id"),
  lastCredentialInvalidation: timestamp("last_credential_invalidation", {
    mode: "date",
    withTimezone: true,
  }),
});

export const groupsTable = authSchema.table("group", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id").notNull(),
});

export const permissionsTable = authSchema.table("permission", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id").notNull(),
});

export const userPermissions = authSchema.table("user_permission", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissionsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id").notNull(),
});

export const groupPermissions = authSchema.table("group_permission", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissionsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id").notNull(),
});

export const userGroups = authSchema.table("user_group", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
  createdById: uuid("created_by_id").notNull(),
  updatedById: uuid("updated_by_id").notNull(),
});

export type DBUser = typeof usersTable.$inferSelect;
export type DBGroup = typeof groupsTable.$inferSelect;
export type DBPermission = typeof permissionsTable.$inferSelect;
export type DBUserPermission = typeof userPermissions.$inferSelect;
export type DBGroupPermission = typeof groupPermissions.$inferSelect;
export type DBUserGroup = typeof userGroups.$inferSelect;

export type DBNewUser = typeof usersTable.$inferInsert;
export type DBNewGroup = typeof groupsTable.$inferInsert;
export type DBNewPermission = typeof permissionsTable.$inferInsert;
export type DBNewUserPermission = typeof userPermissions.$inferInsert;
export type DBNewGroupPermission = typeof groupPermissions.$inferInsert;
export type DBNewUserGroup = typeof userGroups.$inferInsert;
