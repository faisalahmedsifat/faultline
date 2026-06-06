import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    dsnKey: text("dsn_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    dsnKeyIdx: uniqueIndex("projects_dsn_key_idx").on(table.dsnKey)
  })
)

export const errors = pgTable(
  "errors",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    title: text("title").notNull(),
    message: text("message"),
    stack: text("stack"),
    route: text("route"),
    file: text("file"),
    line: integer("line"),
    col: integer("col"),
    env: text("env"),
    level: text("level"),
    status: text("status").notNull().default("open"),
    count: integer("count").notNull().default(1),
    userCount: integer("user_count").notNull().default(0),
    firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    release: text("release"),
    resolvedStack: jsonb("resolved_stack").$type<Record<string, unknown>[] | null>(),
    users: text("users")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`)
  },
  (table) => ({
    projectStatusIdx: index("errors_project_status_idx").on(table.projectId, table.status),
    projectFingerprintIdx: uniqueIndex("errors_project_fingerprint_idx").on(
      table.projectId,
      table.fingerprint
    ),
    projectLastSeenIdx: index("errors_project_last_seen_idx").on(table.projectId, table.lastSeen),
    projectEnvIdx: index("errors_project_env_idx").on(table.projectId, table.env)
  })
)

export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    destination: text("destination").notNull(),
    threshold: integer("threshold").notNull().default(10),
    enabled: boolean("enabled").notNull().default(true)
  },
  (table) => ({
    projectChannelIdx: uniqueIndex("alerts_project_channel_idx").on(table.projectId, table.channel)
  })
)

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ErrorRecord = typeof errors.$inferSelect
export type NewErrorRecord = typeof errors.$inferInsert
export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert

