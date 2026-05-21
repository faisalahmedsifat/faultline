CREATE TABLE IF NOT EXISTS "projects" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "dsn_key" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "projects_dsn_key_idx" ON "projects" ("dsn_key");

CREATE TABLE IF NOT EXISTS "errors" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "fingerprint" text NOT NULL,
  "title" text NOT NULL,
  "message" text,
  "stack" text,
  "route" text,
  "file" text,
  "line" integer,
  "col" integer,
  "env" text,
  "level" text,
  "status" text DEFAULT 'open' NOT NULL,
  "count" integer DEFAULT 1 NOT NULL,
  "user_count" integer DEFAULT 0 NOT NULL,
  "first_seen" timestamptz DEFAULT now() NOT NULL,
  "last_seen" timestamptz DEFAULT now() NOT NULL,
  "metadata" jsonb,
  "users" text[] DEFAULT ARRAY[]::text[] NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "errors_project_fingerprint_idx"
  ON "errors" ("project_id", "fingerprint");
CREATE INDEX IF NOT EXISTS "errors_project_status_idx"
  ON "errors" ("project_id", "status");
CREATE INDEX IF NOT EXISTS "errors_project_last_seen_idx"
  ON "errors" ("project_id", "last_seen");
CREATE INDEX IF NOT EXISTS "errors_project_env_idx"
  ON "errors" ("project_id", "env");

CREATE TABLE IF NOT EXISTS "alerts" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "channel" text NOT NULL,
  "destination" text NOT NULL,
  "threshold" integer DEFAULT 10 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "alerts_project_channel_idx"
  ON "alerts" ("project_id", "channel");

